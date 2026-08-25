import "server-only";

import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppointmentStartAt } from "@/modules/health/lib/appointment-completion-time";
import { CANCELLABLE_HEALTH_APPOINTMENT_STATUSES } from "@/modules/health/lib/appointment-cancellation-policy";
import {
  cancelGoogleMeetEventIdempotently,
  findGoogleMeetEventForCancellation,
} from "@/modules/health/services/google-meet-service";
import {
  enqueueCancellationEmails,
  enqueueHealthOperationalAttentionEmail,
} from "@/modules/health/services/transactional-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { AppointmentCancellationInitiator } from "@prisma/client";

const MAX_ATTEMPTS = 3;
const PROCESSING_LOCK_MINUTES = 10;
const BACKOFF_MINUTES = [1, 5, 15] as const;

const COMPLETED_STEP_STATUSES = ["COMPLETED", "SKIPPED"] as const;

type RequestCancellationInput = {
  appointmentId: string;
  requestedById: string;
  initiator: AppointmentCancellationInitiator;
  reason?: string;
};

export type CancellationRecoveryResult = {
  appointmentId: string;
  status: "COMPLETED" | "PENDING" | "RECONCILIATION_REQUIRED" | "IGNORED";
  error?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro externo desconhecido.";
}

function isStepComplete(status: string) {
  return COMPLETED_STEP_STATUSES.includes(status as never);
}

export async function requestAppointmentCancellation({
  appointmentId,
  requestedById,
  initiator,
  reason,
}: RequestCancellationInput) {
  return db.$transaction(async (tx) => {
    const existing = await tx.appointmentCancellationProcess.findUnique({
      where: { appointmentId },
      select: { id: true, status: true },
    });

    if (existing) return existing;

    const transitioned = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: {
          in: [...CANCELLABLE_HEALTH_APPOINTMENT_STATUSES],
        },
      },
      data: { status: "CANCELLING" },
    });

    if (transitioned.count !== 1) {
      throw new Error(
        "A consulta mudou de estado e nao pode mais ser cancelada.",
      );
    }

    return tx.appointmentCancellationProcess.create({
      data: {
        appointmentId,
        requestedById,
        initiator,
        reason: reason || null,
        maxAttempts: MAX_ATTEMPTS,
      },
      select: { id: true, status: true },
    });
  });
}

async function processMeetStep(processId: string) {
  const process = await db.appointmentCancellationProcess.findUnique({
    where: { id: processId },
    select: {
      meetStatus: true,
      appointment: {
        select: {
          id: true,
          date: true,
          time: true,
          durationMinutes: true,
          timezonePro: true,
          meetLink: true,
          googleEventId: true,
        },
      },
    },
  });

  if (!process || isStepComplete(process.meetStatus)) return;

  const appointment = process.appointment;
  let eventId = appointment.googleEventId;

  if (!eventId && !appointment.meetLink) {
    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: {
        meetStatus: "SKIPPED",
        meetCanceledAt: new Date(),
        meetLastError: null,
      },
    });
    return;
  }

  if (!eventId && appointment.meetLink) {
    const startTime = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

    if (!startTime) throw new Error("Data invalida para localizar o Google Meet.");

    const lookup = await findGoogleMeetEventForCancellation({
      meetLink: appointment.meetLink,
      startTime,
      endTime: new Date(
        startTime.getTime() + appointment.durationMinutes * 60 * 1000,
      ),
    });

    if (lookup.status === "FAILED") throw new Error(lookup.error);

    if (lookup.status === "NOT_FOUND") {
      await db.appointmentCancellationProcess.update({
        where: { id: processId },
        data: {
          meetStatus: "COMPLETED",
          meetCanceledAt: new Date(),
          meetLastError: null,
        },
      });
      return;
    }

    eventId = lookup.eventId;
    await db.appointment.update({
      where: { id: appointment.id },
      data: { googleEventId: eventId },
    });
  }

  if (!eventId) {
    throw new Error("Evento do Google Meet nao identificado para cancelamento.");
  }

  const canceled = await cancelGoogleMeetEventIdempotently(eventId);
  if (canceled.status === "FAILED") throw new Error(canceled.error);

  await db.appointmentCancellationProcess.update({
    where: { id: processId },
    data: {
      meetStatus: "COMPLETED",
      meetCanceledAt: new Date(),
      meetLastError: null,
    },
  });
}

async function findOrCreateStripeRefund({
  appointmentId,
  processId,
  stripeSessionId,
}: {
  appointmentId: string;
  processId: string;
  stripeSessionId: string;
}) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    stripeSessionId,
  );
  const paymentIntent = checkoutSession.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;

  if (!paymentIntentId) {
    throw new Error("Pagamento Stripe nao encontrado para reembolso.");
  }

  const existingRefunds = await stripe.refunds.list({
    payment_intent: paymentIntentId,
    limit: 100,
  });
  const existing = existingRefunds.data.find(
    (refund) =>
      refund.metadata?.appointmentCancellationProcessId === processId ||
      (refund.metadata?.type === "HEALTH_APPOINTMENT_CANCELLATION" &&
        refund.metadata?.appointmentId === appointmentId),
  );

  if (existing) return existing;

  return stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        type: "HEALTH_APPOINTMENT_CANCELLATION",
        appointmentId,
        appointmentCancellationProcessId: processId,
      },
    },
    { idempotencyKey: `health-appointment-cancellation-${appointmentId}` },
  );
}

async function processRefundStep(processId: string) {
  const process = await db.appointmentCancellationProcess.findUnique({
    where: { id: processId },
    select: {
      refundStatus: true,
      refundId: true,
      appointment: {
        select: { id: true, stripeSessionId: true },
      },
    },
  });

  if (!process || isStepComplete(process.refundStatus)) return;
  if (!process.appointment.stripeSessionId) {
    throw new Error("Consulta sem referencia de pagamento Stripe.");
  }

  if (process.refundId) {
    const refund = await stripe.refunds.retrieve(process.refundId);
    if (refund.status === "failed" || refund.status === "canceled") {
      throw new Error(`Reembolso Stripe em estado ${refund.status}.`);
    }
  } else {
    const refund = await findOrCreateStripeRefund({
      appointmentId: process.appointment.id,
      processId,
      stripeSessionId: process.appointment.stripeSessionId,
    });

    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: {
        refundId: refund.id,
        refundStatus: "COMPLETED",
        refundedAt: new Date(),
        refundLastError: null,
      },
    });
    return;
  }

  await db.appointmentCancellationProcess.update({
    where: { id: processId },
    data: {
      refundStatus: "COMPLETED",
      refundedAt: new Date(),
      refundLastError: null,
    },
  });
}

async function processEscrowStep(processId: string) {
  await db.$transaction(async (tx) => {
    const process = await tx.appointmentCancellationProcess.findUnique({
      where: { id: processId },
      select: {
        escrowStatus: true,
        refundStatus: true,
        refundId: true,
        appointment: { select: { id: true, professionalId: true } },
      },
    });

    if (!process || isStepComplete(process.escrowStatus)) return;
    if (!isStepComplete(process.refundStatus)) {
      throw new Error("O saldo so pode ser cancelado apos o reembolso Stripe.");
    }

    const credit = await tx.transaction.findFirst({
      where: {
        appointmentId: process.appointment.id,
        userId: process.appointment.professionalId,
        type: "CREDIT",
        status: { in: ["PENDING", "CANCELED"] },
      },
      select: { id: true, amount: true, status: true },
    });

    if (!credit) {
      throw new Error("Lancamento financeiro da consulta nao encontrado.");
    }

    if (credit.status === "PENDING") {
      const canceled = await tx.transaction.updateMany({
        where: { id: credit.id, status: "PENDING" },
        data: {
          status: "CANCELED",
          description: `Consulta cancelada - Reembolso Stripe: ${process.refundId}`,
        },
      });

      if (canceled.count !== 1) {
        throw new Error("O lancamento financeiro mudou durante o cancelamento.");
      }

      await tx.user.update({
        where: { id: process.appointment.professionalId },
        data: { pendingBalance: { decrement: credit.amount } },
      });
    }

    await tx.appointmentCancellationProcess.update({
      where: { id: processId },
      data: {
        escrowStatus: "COMPLETED",
        escrowCanceledAt: new Date(),
        escrowLastError: null,
      },
    });
  });
}

async function notifyReconciliationRequired(processId: string) {
  await db.$transaction(async (tx) => {
    const process = await tx.appointmentCancellationProcess.findUnique({
      where: { id: processId },
      select: {
        id: true,
        appointmentId: true,
        meetStatus: true,
        refundStatus: true,
        escrowStatus: true,
        reconciliationAlertedAt: true,
      },
    });
    if (!process || process.reconciliationAlertedAt) return;

    const admins = await tx.user.findMany({
      where: { userType: "ADMIN", isActive: true },
      select: { id: true, email: true, name: true, displayName: true },
    });
    const message = `O cancelamento exige reconciliacao manual. Meet: ${process.meetStatus}; reembolso: ${process.refundStatus}; saldo: ${process.escrowStatus}.`;

    for (const admin of admins) {
      await upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType: "HEALTH_CANCELLATION_RECONCILIATION_REQUIRED",
        title: "Cancelamento exige reconciliacao",
        message,
        link: "/dashboard/admin/reconciliacoes",
        entityType: "APPOINTMENT_CANCELLATION",
        entityId: process.id,
      }, tx);
      await enqueueHealthOperationalAttentionEmail(tx, {
        eventType: "HEALTH_CANCELLATION_RECONCILIATION_REQUIRED",
        entityType: "APPOINTMENT_CANCELLATION",
        entityId: process.id,
        appointmentId: process.appointmentId,
        title: "Cancelamento exige reconciliacao",
        summary: message,
        recipient: admin,
      });
    }

    await tx.appointmentCancellationProcess.updateMany({
      where: { id: process.id, reconciliationAlertedAt: null },
      data: { reconciliationAlertedAt: new Date() },
    });
  });
}

async function finalizeCancellation(processId: string) {
  await db.$transaction(async (tx) => {
    const process = await tx.appointmentCancellationProcess.findUnique({
      where: { id: processId },
      select: {
        id: true,
        status: true,
        initiator: true,
        reason: true,
        refundId: true,
        meetStatus: true,
        refundStatus: true,
        escrowStatus: true,
        completionNotifiedAt: true,
        appointment: {
          select: {
            id: true,
            status: true,
            date: true,
            time: true,
            price: true,
            patientId: true,
            professionalId: true,
            notes: true,
            patient: { select: { name: true, email: true } },
            professional: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!process) return;
    if (
      !isStepComplete(process.meetStatus) ||
      !isStepComplete(process.refundStatus) ||
      !isStepComplete(process.escrowStatus)
    ) {
      return;
    }

    if (process.status !== "COMPLETED") {
      const note = `Cancelamento processado em ${new Date().toLocaleString("pt-BR")}. Motivo: ${process.reason || "Nao informado"}. Reembolso Stripe: ${process.refundId || "nao informado"}.`;
      const notes = process.appointment.notes
        ? `${process.appointment.notes}\n\n${note}`
        : note;
      const appointmentUpdate = await tx.appointment.updateMany({
        where: { id: process.appointment.id, status: "CANCELLING" },
        data: { status: "CANCELED", notes },
      });

      if (appointmentUpdate.count !== 1 && process.appointment.status !== "CANCELED") {
        throw new Error("Nao foi possivel finalizar o estado da consulta.");
      }

      await tx.appointmentCancellationProcess.update({
        where: { id: process.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          processingStartedAt: null,
          lastError: null,
        },
      });
    }

    if (process.completionNotifiedAt) return;

    await upsertNotification({
      userId: process.appointment.patientId,
      type: "INFO",
      eventType: "HEALTH_APPOINTMENT_CANCELED",
      title: "Consulta cancelada",
      message: "O cancelamento foi concluido e o reembolso foi solicitado.",
      link: "/agendar-consulta/historico",
      entityType: "APPOINTMENT",
      entityId: process.appointment.id,
      metadata: { refundId: process.refundId },
    }, tx);
    await upsertNotification({
      userId: process.appointment.professionalId,
      type: "INFO",
      eventType: "HEALTH_APPOINTMENT_CANCELED",
      title: "Consulta cancelada",
      message: "O cancelamento e o estorno da consulta foram processados.",
      link: "/agendar-consulta/dashboard-profissional",
      entityType: "APPOINTMENT",
      entityId: process.appointment.id,
      metadata: { refundId: process.refundId },
    }, tx);
    await enqueueCancellationEmails(tx, {
      appointmentId: process.appointment.id,
      cancellationEventId: process.id,
      patient: {
        id: process.appointment.patientId,
        ...process.appointment.patient,
      },
      professional: {
        id: process.appointment.professionalId,
        ...process.appointment.professional,
      },
      date: process.appointment.date,
      time: process.appointment.time,
      price: process.appointment.price,
      reason: process.reason || undefined,
      refundId: process.refundId || undefined,
      canceledBy: process.initiator === "PATIENT" ? "patient" : "professional",
      refundRequested: true,
    });
    await tx.appointmentCancellationProcess.updateMany({
      where: { id: processId, completionNotifiedAt: null },
      data: { completionNotifiedAt: new Date() },
    });
  });
}

export async function processAppointmentCancellation(
  processId: string,
): Promise<CancellationRecoveryResult> {
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const claim = await db.appointmentCancellationProcess.updateMany({
    where: {
      id: processId,
      OR: [
        {
          status: { in: ["PENDING", "RETRY_SCHEDULED"] },
          nextAttemptAt: { lte: now },
        },
        { status: "PROCESSING", processingStartedAt: { lte: staleBefore } },
      ],
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      processingStartedAt: now,
      lastAttemptAt: now,
    },
  });

  if (claim.count !== 1) {
    const current = await db.appointmentCancellationProcess.findUnique({
      where: { id: processId },
      select: { appointmentId: true, status: true },
    });
    return {
      appointmentId: current?.appointmentId || "unknown",
      status:
        current?.status === "COMPLETED"
          ? "COMPLETED"
          : current?.status === "RECONCILIATION_REQUIRED"
            ? "RECONCILIATION_REQUIRED"
            : "IGNORED",
    };
  }

  const process = await db.appointmentCancellationProcess.findUniqueOrThrow({
    where: { id: processId },
    select: { appointmentId: true, attemptCount: true, maxAttempts: true },
  });
  const errors: string[] = [];

  try {
    await processMeetStep(processId);
  } catch (error) {
    const message = errorMessage(error);
    errors.push(`Google Meet: ${message}`);
    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: { meetLastError: message },
    });
  }

  try {
    await processRefundStep(processId);
  } catch (error) {
    const message = errorMessage(error);
    errors.push(`Stripe: ${message}`);
    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: { refundLastError: message },
    });
  }

  try {
    await processEscrowStep(processId);
  } catch (error) {
    const message = errorMessage(error);
    errors.push(`Financeiro: ${message}`);
    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: { escrowLastError: message },
    });
  }

  const current = await db.appointmentCancellationProcess.findUniqueOrThrow({
    where: { id: processId },
    select: {
      meetStatus: true,
      refundStatus: true,
      escrowStatus: true,
    },
  });
  const allStepsComplete =
    isStepComplete(current.meetStatus) &&
    isStepComplete(current.refundStatus) &&
    isStepComplete(current.escrowStatus);

  if (allStepsComplete) {
    await finalizeCancellation(processId);
    return { appointmentId: process.appointmentId, status: "COMPLETED" };
  }

  const lastError = errors.join(" | ") || "Existem etapas pendentes.";
  if (process.attemptCount >= process.maxAttempts) {
    await db.appointmentCancellationProcess.update({
      where: { id: processId },
      data: {
        status: "RECONCILIATION_REQUIRED",
        reconciliationRequiredAt: new Date(),
        processingStartedAt: null,
        lastError,
      },
    });
    await notifyReconciliationRequired(processId);
    return {
      appointmentId: process.appointmentId,
      status: "RECONCILIATION_REQUIRED",
      error: lastError,
    };
  }

  const backoffMinutes =
    BACKOFF_MINUTES[Math.min(process.attemptCount - 1, BACKOFF_MINUTES.length - 1)];
  await db.appointmentCancellationProcess.update({
    where: { id: processId },
    data: {
      status: "RETRY_SCHEDULED",
      nextAttemptAt: new Date(Date.now() + backoffMinutes * 60 * 1000),
      processingStartedAt: null,
      lastError,
    },
  });
  return {
    appointmentId: process.appointmentId,
    status: "PENDING",
    error: lastError,
  };
}

export async function recoverPendingAppointmentCancellations(limit = 25) {
  const staleBefore = new Date(
    Date.now() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const processes = await db.appointmentCancellationProcess.findMany({
    where: {
      OR: [
        {
          status: { in: ["PENDING", "RETRY_SCHEDULED"] },
          nextAttemptAt: { lte: new Date() },
        },
        { status: "PROCESSING", processingStartedAt: { lte: staleBefore } },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: { id: true },
  });

  const results: CancellationRecoveryResult[] = [];
  for (const process of processes) {
    results.push(await processAppointmentCancellation(process.id));
  }

  return {
    processed: results.length,
    completed: results.filter((result) => result.status === "COMPLETED").length,
    pending: results.filter((result) => result.status === "PENDING").length,
    reconciliationRequired: results.filter(
      (result) => result.status === "RECONCILIATION_REQUIRED",
    ).length,
  };
}

async function reopenReconciliation(processId: string) {
  const reopened = await db.appointmentCancellationProcess.updateMany({
    where: { id: processId, status: "RECONCILIATION_REQUIRED" },
    data: {
      status: "RETRY_SCHEDULED",
      attemptCount: 0,
      nextAttemptAt: new Date(),
      processingStartedAt: null,
      reconciliationRequiredAt: null,
      reconciliationAlertedAt: null,
      lastError: null,
    },
  });

  if (reopened.count !== 1) {
    throw new Error("A reconciliacao nao esta pendente ou ja foi retomada.");
  }
}

export async function retryAppointmentCancellationReconciliation(
  processId: string,
) {
  await reopenReconciliation(processId);
  return processAppointmentCancellation(processId);
}

export async function confirmCancellationMeetResolved(processId: string) {
  const updated = await db.appointmentCancellationProcess.updateMany({
    where: {
      id: processId,
      status: "RECONCILIATION_REQUIRED",
      meetStatus: "PENDING",
    },
    data: {
      meetStatus: "COMPLETED",
      meetCanceledAt: new Date(),
      meetLastError: null,
    },
  });

  if (updated.count !== 1) {
    throw new Error("A etapa do Google Meet nao esta pendente.");
  }

  await reopenReconciliation(processId);
  return processAppointmentCancellation(processId);
}

export async function attachCancellationRefundAndRetry(
  processId: string,
  refundId: string,
) {
  const process = await db.appointmentCancellationProcess.findUnique({
    where: { id: processId },
    select: {
      status: true,
      appointment: { select: { stripeSessionId: true } },
    },
  });

  if (!process || process.status !== "RECONCILIATION_REQUIRED") {
    throw new Error("Reconciliacao de cancelamento nao encontrada.");
  }
  if (!process.appointment.stripeSessionId) {
    throw new Error("Consulta sem referencia de pagamento Stripe.");
  }

  const [checkoutSession, refund] = await Promise.all([
    stripe.checkout.sessions.retrieve(process.appointment.stripeSessionId),
    stripe.refunds.retrieve(refundId),
  ]);
  const sessionPaymentIntent =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;
  const refundPaymentIntent =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id;

  if (!sessionPaymentIntent || refundPaymentIntent !== sessionPaymentIntent) {
    throw new Error("O reembolso informado nao pertence a esta consulta.");
  }
  if (refund.status === "failed" || refund.status === "canceled") {
    throw new Error(`O reembolso Stripe esta em estado ${refund.status}.`);
  }

  await db.appointmentCancellationProcess.update({
    where: { id: processId },
    data: {
      refundId: refund.id,
      refundStatus: "COMPLETED",
      refundedAt: new Date(),
      refundLastError: null,
    },
  });
  await reopenReconciliation(processId);
  return processAppointmentCancellation(processId);
}
