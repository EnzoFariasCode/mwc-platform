"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { addMinutes, addMonths, endOfMonth, isBefore } from "date-fns";
import { parseAppointmentDateTime, generateDaySlots } from "./slot-helpers";

// [NOVO] Configurações de negócio
const HOLD_EXPIRATION_MINUTES = 15;

export async function createCheckoutSession(
  proId: string,
  date: string, // Formato YYYY-MM-DD
  time: string, // Formato HH:mm
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      throw new Error("Não autorizado");
    }

    if (!proId) {
      throw new Error("Profissional inválido.");
    }

    const parsedDate = parseAppointmentDateTime(date, time);
    if (!parsedDate) {
      throw new Error("Data ou horário inválido.");
    }

    if (isBefore(parsedDate.dateTime, new Date())) {
      throw new Error("Não é possível agendar um horário no passado.");
    }

    const maxAllowedDate = endOfMonth(addMonths(new Date(), 1));
    if (parsedDate.dateOnly > maxAllowedDate) {
      throw new Error("A data solicitada está fora da janela permitida.");
    }

    // 1. Busca os dados essenciais do Profissional
    const professional = await db.user.findFirst({
      where: {
        id: proId,
        userType: "PROFESSIONAL",
        industry: "HEALTH",
      },
      select: {
        id: true,
        name: true,
        consultationFee: true,
        sessionDuration: true,
      },
    });

    if (!professional || !professional.consultationFee) {
      throw new Error(
        "Profissional não encontrado ou sem valor de consulta configurado.",
      );
    }

    if (professional.id === session.user.id) {
      throw new Error(
        "Você não pode agendar uma consulta com seu próprio perfil.",
      );
    }

    const dayOfWeek = parsedDate.dateOnly.getDay(); // 0 = Domingo, 1 = Segunda

    // 2. Validação via NOVO BANCO RELACIONAL: Exceções e Folgas
    const exception = await db.availabilityException.findFirst({
      where: {
        professionalId: professional.id,
        date: parsedDate.dateOnly,
      },
    });

    if (exception && !exception.isAvailable) {
      throw new Error(
        "O profissional não está atendendo nesta data específica (Folga/Feriado).",
      );
    }

    // 3. Validação via NOVO BANCO RELACIONAL: Dia da semana
    const dayRule = await db.professionalAvailability.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId: professional.id,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    if (!dayRule || !dayRule.isActive) {
      throw new Error("Este profissional não atende neste dia da semana.");
    }

    // 3.5 VALIDAÇÃO DE SEGURANÇA (Prevenção de URL Tampering)
    // Garante que o horário pedido está dentro do expediente e alinhado com a duração da sessão
    const duration = professional.sessionDuration || 50;

    if (!dayRule.startTime || !dayRule.endTime) {
      throw new Error("Agenda do profissional está incompleta.");
    }

    const daySlots = generateDaySlots(
      dayRule.startTime,
      dayRule.endTime,
      parsedDate.dateOnly,
      duration,
    );

    if (!daySlots.includes(time)) {
      throw new Error(
        "Horário inválido, fora do expediente ou não alinhado com a agenda do profissional.",
      );
    }

    // 4. RESERVA ATÔMICA (Evita Double Booking com Hold)
    // Usamos uma transação para garantir que o banco não mude entre a verificação e a inserção
    const hold = await db.$transaction(async (tx) => {
      // A) Checa se já existe uma consulta CONFIRMADA ou PAGA
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          professionalId: professional.id,
          date: parsedDate.dateOnly,
          time,
          status: { not: "CANCELED" },
        },
      });

      if (existingAppointment) {
        throw new Error(
          "Este horário acabou de ser reservado por outra pessoa.",
        );
      }

      // B) Checa se existe um HOLD (Carrinho) ativo de outra pessoa
      const now = new Date();
      await tx.appointmentHold.deleteMany({
        where: {
          professionalId: professional.id,
          date: parsedDate.dateOnly,
          time,
          expiresAt: { lte: now },
        },
      });

      const activeHold = await tx.appointmentHold.findFirst({
        where: {
          professionalId: professional.id,
          date: parsedDate.dateOnly,
          time,
          expiresAt: { gt: now }, // Expiração no futuro
        },
      });

      if (activeHold) {
        if (activeHold.patientId === session.user.id) {
          // É o próprio usuário tentando de novo, vamos reciclar o hold dele
          return {
            id: activeHold.id,
            stripeSessionId: activeHold.stripeSessionId,
          };
        } else {
          throw new Error(
            "Este horário está temporariamente reservado (em processo de pagamento por outro paciente). Tente novamente em 15 minutos.",
          );
        }
      }

      // C) Cria a Reserva Temporária (Hold)
      const expiresAt = addMinutes(now, HOLD_EXPIRATION_MINUTES);
      const newHold = await tx.appointmentHold.create({
        data: {
          professionalId: professional.id,
          patientId: session.user.id,
          date: parsedDate.dateOnly,
          time,
          expiresAt,
        },
      });

      return {
        id: newHold.id,
        stripeSessionId: newHold.stripeSessionId,
      };
    });

    if (hold.stripeSessionId) {
      const existingStripeSession = await stripe.checkout.sessions.retrieve(
        hold.stripeSessionId,
      );

      if (
        existingStripeSession.status === "open" &&
        existingStripeSession.url
      ) {
        return { url: existingStripeSession.url };
      }
    }

    // 5. Configuração Stripe
    const unitAmount = Math.round(Number(professional.consultationFee) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Valor de consulta inválido.");
    }

    const headersList = await headers();
    const origin =
      headersList.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://maximusworldclick.com.br"; // Ajustado para domínio real em falha

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Consulta com ${professional.name}`,
              description: `Agendamento para o dia ${date} às ${time}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        proId,
        patientId: session.user.id,
        date,
        time,
        holdId: hold.id, // Passamos o Hold pro Stripe devolver no Webhook
        type: "HEALTH_APPOINTMENT",
      },
      success_url: `${origin}/checkout-saude/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/agendar-consulta/perfil/${proId}`,
    });

    // 6. Atualiza o Hold com a sessão do Stripe para rastreio cruzado
    if (stripeSession.url) {
      await db.appointmentHold.update({
        where: { id: hold.id },
        data: { stripeSessionId: stripeSession.id },
      });
    }

    return { url: stripeSession.url };
  } catch (error) {
    console.error("Erro Stripe Health:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          "Este horÃ¡rio estÃ¡ temporariamente reservado. Tente novamente em alguns minutos.",
      };
    }

    return {
      error: error instanceof Error ? error.message : "Erro ao gerar pagamento",
    };
  }
}
