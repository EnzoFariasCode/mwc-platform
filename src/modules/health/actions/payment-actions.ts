"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  addMinutes,
  addMonths,
  endOfMonth,
  format,
  isBefore,
  isValid,
  parse,
} from "date-fns";

type DayRule = {
  active: boolean;
  start: string;
  end: string;
};

const dayMap = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

function parseAppointmentDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const dateOnly = new Date(year, month - 1, day);
  const dateTime = new Date(year, month - 1, day, hours, minutes);

  if (
    !isValid(dateOnly) ||
    !isValid(dateTime) ||
    format(dateOnly, "yyyy-MM-dd") !== date ||
    format(dateTime, "HH:mm") !== time
  ) {
    return null;
  }

  return { dateOnly, dateTime };
}

export async function createCheckoutSession(
  proId: string,
  date: string,
  time: string,
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      throw new Error("Nao autorizado");
    }

    if (!proId) {
      throw new Error("Profissional invalido.");
    }

    const parsedDate = parseAppointmentDateTime(date, time);
    if (!parsedDate) {
      throw new Error("Data ou horario invalido.");
    }

    if (isBefore(parsedDate.dateTime, new Date())) {
      throw new Error("Nao e possivel agendar um horario no passado.");
    }

    const maxAllowedDate = endOfMonth(addMonths(new Date(), 1));
    if (parsedDate.dateOnly > maxAllowedDate) {
      throw new Error("A data solicitada esta fora da janela permitida.");
    }

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
        availability: true,
        sessionDuration: true,
      },
    });

    if (!professional || !professional.consultationFee) {
      throw new Error("Profissional nao encontrado ou sem valor de consulta.");
    }

    if (professional.id === session.user.id) {
      throw new Error("Voce nao pode agendar uma consulta com seu proprio perfil.");
    }

    const availability =
      typeof professional.availability === "string"
        ? (JSON.parse(professional.availability) as Record<
            string,
            DayRule | undefined
          >)
        : (professional.availability as Record<string, DayRule | undefined>);

    const dayRule = availability?.[dayMap[parsedDate.dateOnly.getDay()]];
    if (!dayRule || dayRule.active !== true) {
      throw new Error("Este profissional nao atende no dia selecionado.");
    }

    const duration = professional.sessionDuration || 50;
    let currentSlot = parse(dayRule.start, "HH:mm", parsedDate.dateOnly);
    const endSlot = parse(dayRule.end, "HH:mm", parsedDate.dateOnly);
    let isValidSlot = false;

    while (addMinutes(currentSlot, duration) <= endSlot) {
      if (format(currentSlot, "HH:mm") === time) {
        isValidSlot = true;
        break;
      }
      currentSlot = addMinutes(currentSlot, duration);
    }

    if (!isValidSlot) {
      throw new Error("Horario fora da agenda do profissional.");
    }

    const existingAppointment = await db.appointment.findFirst({
      where: {
        professionalId: professional.id,
        date: parsedDate.dateTime,
        time,
        status: { not: "CANCELED" },
      },
      select: { id: true },
    });

    if (existingAppointment) {
      throw new Error("Este horario acabou de ser reservado.");
    }

    const unitAmount = Math.round(Number(professional.consultationFee) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Valor de consulta invalido.");
    }

    const headersList = await headers();
    const origin =
      headersList.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Consulta com ${professional.name}`,
              description: `Agendamento para o dia ${date} as ${time}`,
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
        type: "HEALTH_APPOINTMENT",
      },
      success_url: `${origin}/checkout-saude/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/agendar-consulta/perfil/${proId}`,
    });

    return { url: stripeSession.url };
  } catch (error) {
    console.error("Erro Stripe Health:", error);
    return {
      error:
        error instanceof Error ? error.message : "Erro ao gerar pagamento",
    };
  }
}
