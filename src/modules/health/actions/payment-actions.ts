"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { addMinutes, addMonths, endOfMonth, isBefore } from "date-fns";
import { parseAppointmentDateTime, generateDaySlots } from "./slot-helpers";

// [NOVO] ConfiguraÃ§Ãµes de negÃ³cio
const HOLD_EXPIRATION_MINUTES = 15;

export async function createCheckoutSession(
  proId: string,
  date: string, // Formato YYYY-MM-DD
  time: string, // Formato HH:mm
  paymentTermsInfo?: {
    acceptedPaymentTerms?: boolean;
    paymentTermsAcceptedAt?: string;
  },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      throw new Error("NÃ£o autorizado");
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;
    const origin =
      headersList.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://maximusworldclick.com.br";

    if (!proId) {
      throw new Error("Profissional invÃ¡lido.");
    }

    const parsedDate = parseAppointmentDateTime(date, time);
    if (!parsedDate) {
      throw new Error("Data ou horÃ¡rio invÃ¡lido.");
    }

    if (isBefore(parsedDate.dateTime, new Date())) {
      throw new Error("NÃ£o Ã© possÃ­vel agendar um horÃ¡rio no passado.");
    }

    const maxAllowedDate = endOfMonth(addMonths(new Date(), 1));
    if (parsedDate.dateOnly > maxAllowedDate) {
      throw new Error("A data solicitada estÃ¡ fora da janela permitida.");
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
        "Profissional nÃ£o encontrado ou sem valor de consulta configurado.",
      );
    }

    if (professional.id === session.user.id) {
      throw new Error(
        "VocÃª nÃ£o pode agendar uma consulta com seu prÃ³prio perfil.",
      );
    }

    const dayOfWeek = parsedDate.dateOnly.getDay(); // 0 = Domingo, 1 = Segunda

    // 2. ValidaÃ§Ã£o via NOVO BANCO RELACIONAL: ExceÃ§Ãµes e Folgas
    const exception = await db.availabilityException.findFirst({
      where: {
        professionalId: professional.id,
        date: parsedDate.dateOnly,
      },
    });

    if (exception && !exception.isAvailable) {
      throw new Error(
        "O profissional nÃ£o estÃ¡ atendendo nesta data especÃ­fica (Folga/Feriado).",
      );
    }

    // 3. ValidaÃ§Ã£o via NOVO BANCO RELACIONAL: Dia da semana
    const dayRule = await db.professionalAvailability.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId: professional.id,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    if (!dayRule || !dayRule.isActive) {
      throw new Error("Este profissional nÃ£o atende neste dia da semana.");
    }

    // 3.5 VALIDAÃ‡ÃƒO DE SEGURANÃ‡A (PrevenÃ§Ã£o de URL Tampering)
    // Garante que o horÃ¡rio pedido estÃ¡ dentro do expediente e alinhado com a duraÃ§Ã£o da sessÃ£o
    const duration = professional.sessionDuration || 50;

    if (!dayRule.startTime || !dayRule.endTime) {
      throw new Error("Agenda do profissional estÃ¡ incompleta.");
    }

    const daySlots = generateDaySlots(
      dayRule.startTime,
      dayRule.endTime,
      parsedDate.dateOnly,
      duration,
    );

    if (!daySlots.includes(time)) {
      throw new Error(
        "HorÃ¡rio invÃ¡lido, fora do expediente ou nÃ£o alinhado com a agenda do profissional.",
      );
    }

    // 4. RESERVA ATÃ”MICA (Evita Double Booking com Hold)
    // Usamos uma transaÃ§Ã£o para garantir que o banco nÃ£o mude entre a verificaÃ§Ã£o e a inserÃ§Ã£o
    const hold = await db.$transaction(async (tx) => {
      // A) Checa se jÃ¡ existe uma consulta CONFIRMADA ou PAGA
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
          "Este horÃ¡rio acabou de ser reservado por outra pessoa.",
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
          expiresAt: { gt: now }, // ExpiraÃ§Ã£o no futuro
        },
      });

      if (activeHold) {
        if (activeHold.patientId === session.user.id) {
          // Ã‰ o prÃ³prio usuÃ¡rio tentando de novo, vamos reciclar o hold dele
          return {
            id: activeHold.id,
            stripeSessionId: activeHold.stripeSessionId,
          };
        } else {
          throw new Error(
            "Este horÃ¡rio estÃ¡ temporariamente reservado (em processo de pagamento por outro paciente). Tente novamente em 15 minutos.",
          );
        }
      }

      // C) Cria a Reserva TemporÃ¡ria (Hold)
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

    // [TASK 1] Save payment terms acceptance before Stripe session
    let termsAcceptanceId: string | null = null;
    if (paymentTermsInfo?.acceptedPaymentTerms) {
      const acceptance = await db.paymentTermsAcceptance.create({
        data: {
          userId: session.user.id,
          ipAddress,
          userAgent,
          termsVersion: "v1.0",
        },
      });
      termsAcceptanceId = acceptance.id;
    }

    // 5. ConfiguraÃ§Ã£o Stripe
    const unitAmount = Math.round(Number(professional.consultationFee) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Valor de consulta invÃ¡lido.");
    }


    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Consulta com ${professional.name}`,
              description: `Agendamento para o dia ${date} Ã s ${time}`,
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
        acceptedPaymentTerms: paymentTermsInfo?.acceptedPaymentTerms ? "true" : "false",
        paymentTermsAcceptedAt: paymentTermsInfo?.paymentTermsAcceptedAt || new Date().toISOString(),
        paymentTermsIpAddress: ipAddress,
      },
      success_url: `${origin}/checkout-saude/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/agendar-consulta/perfil/${proId}`,
    });

    // 6. Atualiza o Hold e o aceite de termos com a sessão do Stripe
    if (stripeSession.url) {
      await db.appointmentHold.update({
        where: { id: hold.id },
        data: { stripeSessionId: stripeSession.id },
      });

      // [TASK 1] Link acceptance record to Stripe session
      if (termsAcceptanceId) {
        await db.paymentTermsAcceptance.update({
          where: { id: termsAcceptanceId },
          data: { stripeSessionId: stripeSession.id },
        });
      }
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
          "Este horÃƒÂ¡rio estÃƒÂ¡ temporariamente reservado. Tente novamente em alguns minutos.",
      };
    }

    return {
      error: error instanceof Error ? error.message : "Erro ao gerar pagamento",
    };
  }
}
