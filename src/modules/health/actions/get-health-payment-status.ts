"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export type HealthPaymentStatus =
  | { state: "CONFIRMED" }
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
      return { state: "CONFIRMED" };
    }

    if (appointment.status === "MEETING_REQUIRES_ATTENTION") {
      return {
        state: "REQUIRES_ATTENTION",
        message:
          "O pagamento esta protegido e nossa equipe esta concluindo a sala online.",
      };
    }

    return {
      state: "PROCESSING",
      message:
        "O pagamento foi confirmado pelo webhook e a sala online esta sendo preparada.",
    };
  }

  const hold = await db.appointmentHold.findUnique({
    where: { stripeSessionId },
    select: { patientId: true },
  });

  if (!hold || hold.patientId !== userId) {
    return {
      state: "NOT_FOUND",
      message:
        "A confirmacao ainda nao foi recebida. Atualize esta pagina em alguns instantes.",
    };
  }

  return {
    state: "PROCESSING",
    message:
      "Pagamento recebido pela Stripe. Aguardando a confirmacao automatica do webhook.",
  };
}
