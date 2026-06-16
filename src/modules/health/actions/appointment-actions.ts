"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  sendAppointmentCompletedEmail,
  sendCancellationEmail,
  sendRefundProcessedEmail,
  sendRescheduleEmail,
} from "@/modules/health/services/transactional-email-service";
import {
  generateDaySlots,
  parseAppointmentDateTime,
} from "@/modules/health/actions/slot-helpers";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";

const ADMIN_HEALTH_DISPUTE_DECISION_LIMIT = 20;
const ADMIN_HEALTH_DISPUTE_DECISION_WINDOW_MS = 10 * 60 * 1000;

type EscrowAppointment = {
  id: string;
  professionalId: string;
  stripeSessionId: string | null;
};

async function findPendingCreditTransaction(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
) {
  return await tx.transaction.findFirst({
    where: {
      appointmentId: appointment.id,
      userId: appointment.professionalId,
      type: "CREDIT",
      status: "PENDING",
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

  return pendingTransaction;
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

  return pendingTransaction;
}

async function disputeAppointmentEscrow(
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
      status: "DISPUTED",
      ...(description ? { description } : {}),
    },
  });

  await tx.user.update({
    where: { id: appointment.professionalId },
    data: {
      pendingBalance: { decrement: pendingTransaction.amount },
    },
  });

  return pendingTransaction;
}

async function findDisputedCreditTransaction(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
) {
  return await tx.transaction.findFirst({
    where: {
      appointmentId: appointment.id,
      userId: appointment.professionalId,
      type: "CREDIT",
      status: "DISPUTED",
    },
    select: {
      id: true,
      amount: true,
    },
  });
}

async function releaseDisputedAppointmentEscrow(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
  description?: string,
) {
  const disputedTransaction = await findDisputedCreditTransaction(
    tx,
    appointment,
  );

  if (!disputedTransaction) {
    throw new Error(
      "Transacao financeira em disputa nao encontrada para esta consulta.",
    );
  }

  await tx.transaction.update({
    where: { id: disputedTransaction.id },
    data: {
      status: "COMPLETED",
      ...(description ? { description } : {}),
    },
  });

  await tx.user.update({
    where: { id: appointment.professionalId },
    data: {
      walletBalance: { increment: disputedTransaction.amount },
    },
  });

  return disputedTransaction;
}

async function cancelDisputedAppointmentEscrow(
  tx: Prisma.TransactionClient,
  appointment: EscrowAppointment,
  description?: string,
) {
  const disputedTransaction = await findDisputedCreditTransaction(
    tx,
    appointment,
  );

  if (!disputedTransaction) return;

  await tx.transaction.update({
    where: { id: disputedTransaction.id },
    data: {
      status: "CANCELED",
      ...(description ? { description } : {}),
    },
  });

  return disputedTransaction;
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

function normalizeActionReason(reason?: string) {
  return reason?.trim().replace(/\s+/g, " ") || "";
}

export async function cancelPatientAppointment(
  appointmentId: string,
  reason?: string,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para cancelar." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const normalizedReason = normalizeActionReason(reason);

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        price: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
        patient: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
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

        const releasedTransaction = await releaseAppointmentEscrow(
          tx,
          freshAppointment,
          lateCancelDescription,
        );

        const cancelNote = `Cancelada pelo paciente com menos de 24h de antecedencia em ${new Date().toLocaleString("pt-BR")}. Motivo: ${normalizedReason || "Nao informado"}. Sem reembolso; valor liberado ao profissional como compensacao pela reserva do horario. Transacao: ${releasedTransaction.id}.`;
        const notes = freshAppointment.notes
          ? `${freshAppointment.notes}\n\n${cancelNote}`
          : cancelNote;

        await tx.appointment.update({
          where: { id: freshAppointment.id },
          data: { status: "CANCELED", notes },
        });
      });

      revalidateHealthAppointmentPaths(appointment.professionalId);

      await sendCancellationEmail({
        patient: appointment.patient,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
        reason: normalizedReason,
        canceledBy: "patient",
        refundRequested: false,
        lateCancelFeeApplied: true,
      });

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

      const canceledTransaction = await cancelAppointmentEscrow(
        tx,
        freshAppointment,
      );

      const cancelNote = `Cancelada pelo paciente em ${new Date().toLocaleString("pt-BR")}. Motivo: ${normalizedReason || "Nao informado"}. Reembolso Stripe solicitado: ${refund.id}. Transacao: ${canceledTransaction?.id ?? "nao encontrada"}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${cancelNote}`
        : cancelNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: { status: "CANCELED", notes },
      });
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

    await sendCancellationEmail({
      patient: appointment.patient,
      professional: appointment.professional,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      reason: normalizedReason,
      refundId: refund.id,
      canceledBy: "patient",
      refundRequested: true,
    });

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

export async function cancelProfessionalAppointment(
  appointmentId: string,
  reason?: string,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para cancelar." };
  }

  if (
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Ação restrita a profissionais de Saúde." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const normalizedReason = normalizeActionReason(reason);

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        price: true,
        status: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
        patient: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
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

      const canceledTransaction = await cancelAppointmentEscrow(
        tx,
        freshAppointment,
      );

      const cancelNote = `Cancelada pelo profissional em ${new Date().toLocaleString("pt-BR")}. Motivo: ${normalizedReason || "Nao informado"}. Reembolso Stripe solicitado: ${refund.id}. Transacao: ${canceledTransaction?.id ?? "nao encontrada"}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${cancelNote}`
        : cancelNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: { status: "CANCELED", notes },
      });
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

    await sendCancellationEmail({
      patient: appointment.patient,
      professional: appointment.professional,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      reason: normalizedReason,
      refundId: refund.id,
      canceledBy: "professional",
      refundRequested: true,
    });

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
        price: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        notes: true,
        patient: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
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

      const disputedTransaction = await disputeAppointmentEscrow(
        tx,
        freshAppointment,
        `DISPUTE_OPENED - Disputa aberta pelo paciente em ${new Date().toLocaleString("pt-BR")}. Motivo: ${normalizedReason}`,
      );

      const disputeNote = `Disputa aberta pelo paciente em ${new Date().toLocaleString("pt-BR")}: ${normalizedReason}. Valor retido para mediacao. Transacao: ${disputedTransaction.id}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${disputeNote}`
        : disputeNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: {
          status: "DISPUTED",
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

export async function resolveHealthAppointmentDispute({
  appointmentId,
  decision,
  reason,
}: {
  appointmentId: string;
  decision: "REFUND_PATIENT" | "RELEASE_TO_PROFESSIONAL";
  reason?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Nao autorizado." };
  }

  if (session.user.role !== "ADMIN" && session.user.userType !== "ADMIN") {
    return { error: "Acao restrita a administradores." };
  }

  const rateLimitError = await consumeRateLimit({
    key: `admin:health-dispute-decision:user:${session.user.id}`,
    limit: ADMIN_HEALTH_DISPUTE_DECISION_LIMIT,
    windowMs: ADMIN_HEALTH_DISPUTE_DECISION_WINDOW_MS,
    message: "Muitas decisoes de disputa em sequencia. Aguarde um instante.",
  });

  if (rateLimitError) {
    return { error: rateLimitError };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  const normalizedReason = normalizeActionReason(reason);

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        price: true,
        status: true,
        professionalId: true,
        stripeSessionId: true,
        disputeReason: true,
        notes: true,
        patient: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
      },
    });

    if (!appointment) throw new Error("Consulta nao encontrada.");

    if (appointment.status !== "DISPUTED") {
      throw new Error("Apenas consultas em disputa podem ser resolvidas.");
    }

    if (
      decision !== "REFUND_PATIENT" &&
      decision !== "RELEASE_TO_PROFESSIONAL"
    ) {
      throw new Error("Decisao de disputa invalida.");
    }

    let refundId: string | undefined;

    if (decision === "REFUND_PATIENT") {
      if (!appointment.stripeSessionId) {
        throw new Error("Consulta sem referencia de pagamento Stripe.");
      }

      const refund = await refundStripeCheckoutSession(
        appointment.stripeSessionId,
        `health-appointment-admin-dispute-refund-${appointment.id}`,
      );
      refundId = refund.id;
    }

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

      if (freshAppointment.status !== "DISPUTED") {
        throw new Error("Apenas consultas em disputa podem ser resolvidas.");
      }

      const resolvedAt = new Date().toLocaleString("pt-BR");

      if (decision === "REFUND_PATIENT") {
        const canceledTransaction = await cancelDisputedAppointmentEscrow(
          tx,
          freshAppointment,
          `DISPUTE_RESOLVED_REFUND - Reembolso aprovado pela mediacao em ${resolvedAt}. Motivo: ${normalizedReason || "Nao informado"}.`,
        );

        const resolutionNote = `Disputa resolvida pela mediacao em ${resolvedAt}: reembolso aprovado ao paciente. Motivo: ${normalizedReason || "Nao informado"}. Reembolso Stripe: ${refundId}. Transacao: ${canceledTransaction?.id ?? "nao encontrada"}.`;
        const notes = freshAppointment.notes
          ? `${freshAppointment.notes}\n\n${resolutionNote}`
          : resolutionNote;

        await tx.appointment.update({
          where: { id: freshAppointment.id },
          data: { status: "REFUNDED", notes },
        });

        await createAdminAuditLog(tx, {
          actorId: session.user.id,
          action: "HEALTH_DISPUTE_REFUND_PATIENT",
          entityType: "HEALTH_APPOINTMENT",
          entityId: freshAppointment.id,
          reason: normalizedReason || "Nao informado",
          receiptUrl: null,
          metadata: {
            patientName: appointment.patient.name,
            patientEmail: appointment.patient.email,
            professionalName: appointment.professional.name,
            professionalEmail: appointment.professional.email,
            price: appointment.price.toNumber(),
            refundId: refundId ?? null,
            transactionId: canceledTransaction?.id ?? null,
          },
        });

        return;
      }

      const releasedTransaction = await releaseDisputedAppointmentEscrow(
        tx,
        freshAppointment,
        `DISPUTE_RESOLVED_RELEASE - Valor liberado ao profissional pela mediacao em ${resolvedAt}. Motivo: ${normalizedReason || "Nao informado"}.`,
      );

      const resolutionNote = `Disputa resolvida pela mediacao em ${resolvedAt}: valor liberado ao profissional. Motivo: ${normalizedReason || "Nao informado"}. Transacao: ${releasedTransaction.id}.`;
      const notes = freshAppointment.notes
        ? `${freshAppointment.notes}\n\n${resolutionNote}`
        : resolutionNote;

      await tx.appointment.update({
        where: { id: freshAppointment.id },
        data: { status: "COMPLETED", notes },
      });

      await createAdminAuditLog(tx, {
        actorId: session.user.id,
        action: "HEALTH_DISPUTE_RELEASE_PROFESSIONAL",
        entityType: "HEALTH_APPOINTMENT",
        entityId: freshAppointment.id,
        reason: normalizedReason || "Nao informado",
        receiptUrl: null,
        metadata: {
          patientName: appointment.patient.name,
          patientEmail: appointment.patient.email,
          professionalName: appointment.professional.name,
          professionalEmail: appointment.professional.email,
          price: appointment.price.toNumber(),
          transactionId: releasedTransaction.id,
        },
      });
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

    if (decision === "REFUND_PATIENT") {
      await sendRefundProcessedEmail({
        patient: appointment.patient,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
        reason: normalizedReason || appointment.disputeReason || undefined,
        refundId,
      });
    } else {
      await sendAppointmentCompletedEmail({
        patient: appointment.patient,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[RESOLVE_HEALTH_APPOINTMENT_DISPUTE_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel resolver a disputa da consulta.",
    };
  }
}

export async function completeHealthAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para concluir a consulta." };
  }

  if (
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Ação restrita a profissionais de Saúde." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const completedAppointment = await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          date: true,
          time: true,
          price: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          patient: { select: { name: true, email: true } },
          professional: { select: { name: true, email: true } },
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

      return appointment;
    });

    revalidateHealthAppointmentPaths(session.user.id);

    await sendAppointmentCompletedEmail({
      patient: completedAppointment.patient,
      professional: completedAppointment.professional,
      date: completedAppointment.date,
      time: completedAppointment.time,
      price: completedAppointment.price,
    });

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

export async function markPatientNoShowAppointment(
  appointmentId: string,
  reason?: string,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para marcar ausencia." };
  }

  if (
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Ação restrita a profissionais de Saúde." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const normalizedReason = normalizeActionReason(reason);

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

      const releasedTransaction = await releaseAppointmentEscrow(
        tx,
        appointment,
      );

      const noShowNote = `Paciente marcado como nao compareceu em ${new Date().toLocaleString("pt-BR")}. Motivo/evidencia: ${normalizedReason || "Nao informado"}. Transacao: ${releasedTransaction.id}.`;
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
      price: true,
      professionalId: true,
      stripeSessionId: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
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
      const didComplete = await db.$transaction(async (tx) => {
        const claimedAppointment = await tx.appointment.updateMany({
          where: {
            id: appointment.id,
            status: "CONFIRMED",
          },
          data: { status: "COMPLETED" },
        });

        if (claimedAppointment.count === 0) {
          return false;
        }

        await releaseAppointmentEscrow(tx, {
          id: appointment.id,
          professionalId: appointment.professionalId,
          stripeSessionId: appointment.stripeSessionId,
        });

        return true;
      });

      if (didComplete) {
        completed += 1;
        await sendAppointmentCompletedEmail({
          patient: appointment.patient,
          professional: appointment.professional,
          date: appointment.date,
          time: appointment.time,
          price: appointment.price,
        });
      }
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

export async function rescheduleHealthAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Nao autorizado." };
    }

    if (
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { error: "Ação restrita a profissionais de Saúde." };
    }

    if (!appointmentId) {
      return { error: "Consulta invalida." };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        professionalId: true,
        patientId: true,
        stripeSessionId: true,
        price: true,
        notes: true,
        meetLink: true,
        patient: { select: { name: true, email: true } },
        professional: {
          select: { name: true, email: true, sessionDuration: true },
        },
      },
    });

    if (!appointment) {
      return { error: "Consulta nao encontrada." };
    }

    if (appointment.professionalId !== session.user.id) {
      return { error: "Apenas o profissional pode reagendar esta consulta." };
    }

    if (appointment.status !== "CONFIRMED") {
      return { error: "Apenas consultas confirmadas podem ser reagendadas." };
    }

    const currentDateTime = appointmentDateTime(
      appointment.date,
      appointment.time,
    );

    if (!currentDateTime) {
      return { error: "Data atual da consulta invalida." };
    }

    const hoursUntilCurrent =
      (currentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilCurrent < 24) {
      return {
        error:
          "Reagendamento nao permitido com menos de 24 horas de antecedencia.",
      };
    }

    const parsedNewDate = parseAppointmentDateTime(newDate, newTime);

    if (!parsedNewDate) {
      return { error: "Data ou horario invalido." };
    }

    if (parsedNewDate.dateTime <= new Date()) {
      return { error: "O novo horario deve ser no futuro." };
    }

    const hoursUntilNew =
      (parsedNewDate.dateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilNew < 24) {
      return {
        error: "O novo horario deve ter pelo menos 24 horas de antecedencia.",
      };
    }

    const dayOfWeek = parsedNewDate.dateOnly.getDay();

    const exception = await db.availabilityException.findFirst({
      where: {
        professionalId: appointment.professionalId,
        date: parsedNewDate.dateOnly,
      },
    });

    if (exception && !exception.isAvailable) {
      return { error: "Profissional nao atende nesta data." };
    }

    const dayRule = await db.professionalAvailability.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId: appointment.professionalId,
          dayOfWeek,
        },
      },
    });

    if (!dayRule || !dayRule.isActive || !dayRule.startTime || !dayRule.endTime) {
      return { error: "Profissional nao atende neste dia da semana." };
    }

    const duration = appointment.professional.sessionDuration || 50;
    const validSlots = generateDaySlots(
      dayRule.startTime,
      dayRule.endTime,
      parsedNewDate.dateOnly,
      duration,
    );

    if (!validSlots.includes(newTime)) {
      return {
        error:
          "Horario invalido, fora do expediente ou desalinhado com a agenda.",
      };
    }

    const existingAppointment = await db.appointment.findFirst({
      where: {
        professionalId: appointment.professionalId,
        date: parsedNewDate.dateOnly,
        time: newTime,
        status: { in: ["PENDING_PAYMENT", "PAID", "CONFIRMED"] },
        id: { not: appointmentId },
      },
      select: { id: true },
    });

    if (existingAppointment) {
      return { error: "Este horario ja esta reservado." };
    }

    const activeHold = await db.appointmentHold.findFirst({
      where: {
        professionalId: appointment.professionalId,
        date: parsedNewDate.dateOnly,
        time: newTime,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (activeHold) {
      return {
        error:
          "Este horario esta temporariamente reservado. Tente novamente em alguns minutos.",
      };
    }

    const rescheduleNote = `Reagendado pelo profissional em ${new Date().toLocaleString("pt-BR")}. De ${appointment.date.toLocaleDateString("pt-BR")} as ${appointment.time} para ${newDate} as ${newTime}. Pagamento original mantido.`;
    const notes = appointment.notes
      ? `${appointment.notes}\n\n${rescheduleNote}`
      : rescheduleNote;

    const updated = await db.appointment.updateMany({
      where: {
        id: appointmentId,
        status: "CONFIRMED",
        professionalId: session.user.id,
      },
      data: {
        date: parsedNewDate.dateOnly,
        time: newTime,
        notes,
      },
    });

    if (updated.count === 0) {
      return { error: "Consulta nao esta mais disponivel para reagendamento." };
    }

    try {
      await sendRescheduleEmail({
        patient: appointment.patient,
        professional: appointment.professional,
        previousDate: appointment.date,
        previousTime: appointment.time,
        date: parsedNewDate.dateOnly,
        time: newTime,
        price: appointment.price,
        meetLink: appointment.meetLink,
      });
    } catch (emailError) {
      console.error("[RESCHEDULE] Email failed (non-blocking):", emailError);
    }

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return { success: true };
  } catch (error) {
    console.error("[RESCHEDULE_APPOINTMENT_ERROR]", error);
    return { error: "Erro ao reagendar consulta." };
  }
}

