"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type EscrowAppointment = {
  id: string;
  professionalId: string;
  stripeSessionId: string | null;
};

async function findPendingCreditTransaction(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
) {
  if (!appointment.stripeSessionId) {
    throw new Error("Consulta sem referencia de pagamento Stripe.");
  }

  return await tx.transaction.findFirst({
    where: {
      userId: appointment.professionalId,
      type: "CREDIT",
      status: "PENDING",
      description: {
        contains: appointment.stripeSessionId,
      },
    },
    select: {
      id: true,
      amount: true,
    },
  });
}

async function releaseAppointmentEscrow(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
  description?: string,
) {
  const pendingTransaction = await findPendingCreditTransaction(tx, appointment);

  if (!pendingTransaction) {
    throw new Error(
      "Transacao financeira pendente nao encontrada para esta consulta.",
    );
  }

  await tx.transaction.update({
    where: { id: pendingTransaction.id },
    data: {
      status: "COMPLETED",
      ...(description ? { description } : {}),
    },
  });

  await tx.user.update({
    where: { id: appointment.professionalId },
    data: {
      pendingBalance: { decrement: pendingTransaction.amount },
      walletBalance: { increment: pendingTransaction.amount },
    },
  });
}

async function cancelAppointmentEscrow(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
) {
  const pendingTransaction = await findPendingCreditTransaction(tx, appointment);

  if (!pendingTransaction) return;

  await tx.transaction.update({
    where: { id: pendingTransaction.id },
    data: { status: "CANCELED" },
  });

  await tx.user.update({
    where: { id: appointment.professionalId },
    data: {
      pendingBalance: { decrement: pendingTransaction.amount },
    },
  });
}

async function refundStripeCheckoutSession(
  stripeSessionId: string,
  idempotencyKey: string,
) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    stripeSessionId,
  );
  const paymentIntent = checkoutSession.payment_intent;

  if (!paymentIntent) {
    throw new Error("Pagamento Stripe nao encontrado para reembolso.");
  }

  const paymentIntentId =
    typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;

  return await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey },
  );
}

function appointmentDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const dateTime = new Date(date);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  dateTime.setHours(hours, minutes, 0, 0);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function revalidateHealthAppointmentPaths(professionalId?: string) {
  revalidatePath("/agendar-consulta/historico");
  revalidatePath("/agendar-consulta/dashboard-profissional");
  revalidatePath("/agendar-consulta/financeiro");
  revalidatePath("/dashboard/financeiro");

  if (professionalId) {
    revalidatePath(`/agendar-consulta/perfil/${professionalId}`);
  }
}

const terminalStatuses = [
  "CANCELED",
  "COMPLETED",
  "REFUNDED",
  "NO_SHOW",
  "DISPUTED",
] as const;

export async function cancelPatientAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para cancelar." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
      },
    });

    if (!appointment) throw new Error("Consulta nao encontrada.");

    if (appointment.patientId !== session.user.id) {
      throw new Error("Voce nao tem permissao para cancelar esta consulta.");
    }

    if (terminalStatuses.includes(appointment.status as never)) {
      throw new Error("Apenas consultas agendadas podem ser canceladas.");
    }

    const scheduledAt = appointmentDateTime(appointment.date, appointment.time);

    if (!scheduledAt || scheduledAt <= new Date()) {
      throw new Error("Nao e possivel cancelar uma consulta passada.");
    }

    const twentyFourHoursFromNow = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    if (scheduledAt < twentyFourHoursFromNow) {
      await db.$transaction(async (tx) => {
        const freshAppointment = await tx.appointment.findUnique({
          where: { id: appointment.id },
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
            professionalId: true,
            stripeSessionId: true,
            notes: true,
          },
        });

        if (!freshAppointment) throw new Error("Consulta nao encontrada.");

        if (terminalStatuses.includes(freshAppointment.status as never)) {
          throw new Error("Apenas consultas agendadas podem ser canceladas.");
        }

        const freshScheduledAt = appointmentDateTime(
          freshAppointment.date,
          freshAppointment.time,
        );

        if (!freshScheduledAt || freshScheduledAt <= new Date()) {
          throw new Error("Nao e possivel cancelar uma consulta passada.");
        }

        const lateCancelDescription = `LATE_CANCEL_FEE - Cancelamento tardio pelo paciente (${new Date().toLocaleString("pt-BR")}) - Stripe: ${freshAppointment.stripeSessionId}`;

        await releaseAppointmentEscrow(
          tx,
          freshAppointment,
          lateCancelDescription,
        );

        const cancelNote = `Cancelada pelo paciente com menos de 24h de antecedencia em ${new Date().toLocaleString("pt-BR")}. Sem reembolso; valor liberado ao profissional como compensacao pela reserva do horario.`;
        const notes = freshAppointment.notes
          ? `${freshAppointment.notes}\n\n${cancelNote}`
          : cancelNote;

        await tx.appointment.update({
          where: { id: freshAppointment.id },
          data: { status: "CANCELED", notes },
        });
      });

      revalidateHealthAppointmentPaths(appointment.professionalId);

      return { success: true };
    }

    if (!appointment.stripeSessionId) {
      throw new Error("Consulta sem referencia de pagamento Stripe.");
    }

    const refund = await refundStripeCheckoutSession(
      appointment.stripeSessionId,
      `health-appointment-cancel-${appointment.id}`,
    );

    await db.$transaction(async (tx) => {
      const freshAppointment = await tx.appointment.findUnique({
        where: { id: appointment.id },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
        },
      });

      if (!freshAppointment) throw new Error("Consulta nao encontrada.");

      if (terminalStatuses.includes(freshAppointment.status as never)) {
        throw new Error("Apenas consultas agendadas podem ser canceladas.");
      }

      await cancelAppointmentEscrow(tx, freshAppointment);

      const cancelNote = `Cancelada pelo paciente em ${new Date().toLocaleString("pt-BR")}. Reembolso Stripe solicitado: ${refund.id}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${cancelNote}`
        : cancelNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: { status: "CANCELED", notes },
      });
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return { success: true };
  } catch (error) {
    console.error("[CANCEL_PATIENT_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a consulta.",
    };
  }
}

export async function cancelProfessionalAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para cancelar." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
      },
    });

    if (!appointment) throw new Error("Consulta nao encontrada.");

    if (appointment.professionalId !== session.user.id) {
      throw new Error("Voce nao tem permissao para cancelar esta consulta.");
    }

    if (terminalStatuses.includes(appointment.status as never)) {
      throw new Error("Apenas consultas agendadas podem ser canceladas.");
    }

    if (!appointment.stripeSessionId) {
      throw new Error("Consulta sem referencia de pagamento Stripe.");
    }

    const refund = await refundStripeCheckoutSession(
      appointment.stripeSessionId,
      `health-appointment-pro-cancel-${appointment.id}`,
    );

    await db.$transaction(async (tx) => {
      const freshAppointment = await tx.appointment.findUnique({
        where: { id: appointment.id },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
        },
      });

      if (!freshAppointment) throw new Error("Consulta nao encontrada.");

      if (terminalStatuses.includes(freshAppointment.status as never)) {
        throw new Error("Apenas consultas agendadas podem ser canceladas.");
      }

      await cancelAppointmentEscrow(tx, freshAppointment);

      const cancelNote = `Cancelada pelo profissional em ${new Date().toLocaleString("pt-BR")}. Reembolso Stripe solicitado: ${refund.id}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${cancelNote}`
        : cancelNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: { status: "CANCELED", notes },
      });
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return { success: true };
  } catch (error) {
    console.error("[CANCEL_PROFESSIONAL_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a consulta.",
    };
  }
}

export async function reportHealthAppointmentDispute(
  appointmentId: string,
  reason: string,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para reportar um problema." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  const normalizedReason = reason.trim();

  if (normalizedReason.length < 10) {
    return { error: "Descreva o problema com pelo menos 10 caracteres." };
  }

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
      },
    });

    if (!appointment) throw new Error("Consulta nao encontrada.");

    if (appointment.patientId !== session.user.id) {
      throw new Error("Voce nao tem permissao para disputar esta consulta.");
    }

    if (appointment.status !== "CONFIRMED") {
      throw new Error("Apenas consultas confirmadas podem ser disputadas.");
    }

    const scheduledAt = appointmentDateTime(appointment.date, appointment.time);

    if (!scheduledAt || scheduledAt > new Date()) {
      throw new Error("A disputa so pode ser aberta apos o horario da consulta.");
    }

    if (!appointment.stripeSessionId) {
      throw new Error("Consulta sem referencia de pagamento Stripe.");
    }

    const refund = await refundStripeCheckoutSession(
      appointment.stripeSessionId,
      `health-appointment-dispute-refund-${appointment.id}`,
    );

    const result = await db.$transaction(async (tx) => {
      const freshAppointment = await tx.appointment.findUnique({
        where: { id: appointment.id },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
        },
      });

      if (!freshAppointment) throw new Error("Consulta nao encontrada.");

      if (freshAppointment.status !== "CONFIRMED") {
        throw new Error("Apenas consultas confirmadas podem ser disputadas.");
      }

      await cancelAppointmentEscrow(tx, freshAppointment);

      const disputeNote = `Disputa aberta pelo paciente em ${new Date().toLocaleString("pt-BR")}: ${normalizedReason}. Reembolso Stripe solicitado: ${refund.id}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${disputeNote}`
        : disputeNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: {
          status: "REFUNDED",
          disputeReason: normalizedReason,
          disputeOpenedAt: new Date(),
          notes,
        },
      });

      return { professionalId: freshAppointment.professionalId };
    });

    revalidateHealthAppointmentPaths(result.professionalId);

    return { success: true };
  } catch (error) {
    console.error("[REPORT_HEALTH_APPOINTMENT_DISPUTE_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir a disputa da consulta.",
    };
  }
}
export async function completeHealthAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para concluir a consulta." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
        },
      });

      if (!appointment) throw new Error("Consulta nao encontrada.");

      if (appointment.professionalId !== session.user.id) {
        throw new Error("Voce nao tem permissao para concluir esta consulta.");
      }

      if (appointment.status !== "CONFIRMED") {
        throw new Error("Apenas consultas confirmadas podem ser concluidas.");
      }

      await releaseAppointmentEscrow(tx, appointment);

      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: "COMPLETED" },
      });
    });

    revalidateHealthAppointmentPaths(session.user.id);

    return { success: true };
  } catch (error) {
    console.error("[COMPLETE_HEALTH_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir a consulta.",
    };
  }
}

export async function markPatientNoShowAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para marcar ausencia." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
        },
      });

      if (!appointment) throw new Error("Consulta nao encontrada.");

      if (appointment.professionalId !== session.user.id) {
        throw new Error("Voce nao tem permissao para marcar ausencia nesta consulta.");
      }

      if (appointment.status !== "CONFIRMED") {
        throw new Error("Apenas consultas confirmadas podem ser marcadas como ausencia.");
      }

      const scheduledAt = appointmentDateTime(appointment.date, appointment.time);

      if (!scheduledAt || scheduledAt > new Date()) {
        throw new Error("A ausencia so pode ser marcada apos o horario da consulta.");
      }

      await releaseAppointmentEscrow(tx, appointment);

      const noShowNote = `Paciente marcado como nao compareceu em ${new Date().toLocaleString("pt-BR")}.`;
      const notes = appointment.notes
        ? `${appointment.notes}\n\n${noShowNote}`
        : noShowNote;

      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: "NO_SHOW", notes },
      });
    });

    revalidateHealthAppointmentPaths(session.user.id);

    return { success: true };
  } catch (error) {
    console.error("[MARK_PATIENT_NO_SHOW_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel marcar ausencia do paciente.",
    };
  }
}

export async function autoCompleteHealthAppointments() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const appointments = await db.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { lte: twentyFourHoursAgo },
    },
    select: {
      id: true,
      date: true,
      time: true,
      professionalId: true,
      stripeSessionId: true,
    },
  });

  let completed = 0;
  const failed: Array<{ appointmentId: string; error: string }> = [];

  for (const appointment of appointments) {
    const scheduledAt = appointmentDateTime(appointment.date, appointment.time);

    if (!scheduledAt) continue;

    const releaseAt = new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000);
    if (releaseAt > now) continue;

    try {
      await db.$transaction(async (tx) => {
        const freshAppointment = await tx.appointment.findUnique({
          where: { id: appointment.id },
          select: {
            id: true,
            status: true,
            professionalId: true,
            stripeSessionId: true,
          },
        });

        if (!freshAppointment || freshAppointment.status !== "CONFIRMED") {
          return;
        }

        await releaseAppointmentEscrow(tx, freshAppointment);

        await tx.appointment.update({
          where: { id: freshAppointment.id },
          data: { status: "COMPLETED" },
        });
      });

      completed += 1;
    } catch (error) {
      failed.push({
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  }

  revalidateHealthAppointmentPaths();

  return { completed, failed };
}

