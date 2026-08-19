"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export type HealthPaymentStatus =
  | {
      state: "CONFIRMED";
      meetingState: "READY" | "PROCESSING" | "REQUIRES_ATTENTION";
      message: string;
    }
  | { state: "PROCESSING"; message: string }
  | { state: "REQUIRES_ATTENTION"; message: string }
  | { state: "NOT_FOUND"; message: string };

export async function getHealthPaymentStatus(
  stripeSessionId: string,
): Promise<HealthPaymentStatus> {
  const session = await verifySession();
  const userId = session?.sub as string | undefined;

  if (!userId || !stripeSessionId) {
    return {
      state: "NOT_FOUND",
      message: "Nao foi possivel localizar o pagamento.",
    };
  }

  const appointment = await db.appointment.findUnique({
    where: { stripeSessionId },
    select: { patientId: true, status: true },
  });

  if (appointment) {
    if (appointment.patientId !== userId) {
      return { state: "NOT_FOUND", message: "Pagamento nao autorizado." };
    }

    if (appointment.status === "CONFIRMED") {
      return {
        state: "CONFIRMED",
        meetingState: "READY",
        message: "Pagamento e agendamento confirmados.",
      };
    }

    if (appointment.status === "MEETING_REQUIRES_ATTENTION") {
      return {
        state: "CONFIRMED",
        meetingState: "REQUIRES_ATTENTION",
        message:
          "Agendamento confirmado. O pagamento esta protegido e nossa equipe esta concluindo a sala online.",
      };
    }

    if (
      appointment.status === "MEETING_PENDING" ||
      appointment.status === "PAID"
    ) {
      return {
        state: "CONFIRMED",
        meetingState: "PROCESSING",
        message:
          "Agendamento confirmado. A sala online esta sendo preparada e aparecera no historico assim que estiver pronta.",
      };
    }

    return {
      state: "REQUIRES_ATTENTION",
      message:
        "O pagamento foi localizado, mas o agendamento possui uma atualizacao de status. Consulte seus atendimentos.",
    };
  }

  const hold = await db.appointmentHold.findUnique({
    where: { stripeSessionId },
    select: { patientId: true },
  });

  if (hold && hold.patientId !== userId) {
    return {
      state: "NOT_FOUND",
      message: "Pagamento nao autorizado.",
    };
  }

  return {
    state: "PROCESSING",
    message:
      "A Stripe concluiu o checkout. Estamos aguardando a confirmacao automatica do webhook.",
  };
}
