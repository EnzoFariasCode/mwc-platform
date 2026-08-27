"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  enqueueAppointmentCompletedEmail,
  enqueueCancellationEmails,
} from "@/modules/health/services/transactional-email-service";
import {
  generateDaySlots,
  parseAppointmentDateTime,
} from "@/modules/health/actions/slot-helpers";
import {
  getAppointmentCompletionAt,
  getAppointmentStartAt,
} from "@/modules/health/lib/appointment-completion-time";
import { isHealthAppointmentStatusCancellable } from "@/modules/health/lib/appointment-cancellation-policy";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { requireAdminRole } from "@/lib/get-session";
import { validateAdminDecisionReason } from "@/modules/admin/lib/admin-decision-reason";
import { enqueueAdminNotificationEmails } from "@/modules/email/services/admin-finance-email-service";
import {
  cancelGoogleMeetEvent,
  findGoogleMeetEventId,
} from "@/modules/health/services/google-meet-service";
import {
  processAppointmentCancellation,
  requestAppointmentCancellation,
} from "@/modules/health/services/appointment-cancellation-recovery";
import {
  processAppointmentReschedule,
  requestAppointmentReschedule,
} from "@/modules/health/services/appointment-reschedule-recovery";
import { healthReasonCategoryForEmail } from "@/modules/health/lib/health-email-privacy";

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

async function claimHealthDisputeDecision({
  appointmentId,
  decision,
  adminId,
}: {
  appointmentId: string;
  decision: "REFUND_PATIENT" | "RELEASE_TO_PROFESSIONAL";
  adminId: string;
}) {
  const claimed = await db.appointment.updateMany({
    where: {
      id: appointmentId,
      status: "DISPUTED",
      disputeDecisionClaim: null,
    },
    data: {
      disputeDecisionClaim: decision,
      disputeDecisionClaimedAt: new Date(),
      disputeDecisionClaimedBy: adminId,
    },
  });

  if (claimed.count === 1) return;

  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, disputeDecisionClaim: true },
  });
  if (!current || current.status !== "DISPUTED") {
    throw new Error("A disputa ja foi resolvida por outra operacao.");
  }
  if (current.disputeDecisionClaim !== decision) {
    throw new Error(
      "Esta disputa ja possui outra decisao em processamento. Atualize a pagina.",
    );
  }
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

async function resolveGoogleEventIdForAppointment({
  appointmentId,
  date,
  time,
  timezonePro,
  meetLink,
  googleEventId,
  durationMinutes,
}: {
  appointmentId: string;
  date: Date;
  time: string;
  timezonePro: string;
  meetLink?: string | null;
  googleEventId?: string | null;
  durationMinutes: number;
}): Promise<{ eventId: string | null; error?: string }> {
  if (googleEventId) return { eventId: googleEventId };
  if (!meetLink) return { eventId: null };

  const scheduledAt = getAppointmentStartAt({
    date,
    time,
    timeZone: timezonePro,
  });

  if (!scheduledAt) {
    return {
      eventId: null,
      error: "Data da consulta invalida para sincronizar o Google Calendar.",
    };
  }

  const foundEventId = await findGoogleMeetEventId({
    meetLink,
    startTime: scheduledAt,
    endTime: new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000),
  });

  if (!foundEventId) {
    return {
      eventId: null,
      error:
        "Nao foi possivel localizar o evento antigo no Google Calendar. A acao nao foi aplicada.",
    };
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { googleEventId: foundEventId },
  });

  return { eventId: foundEventId };
}

async function cancelGoogleMeetForAppointment(params: {
  appointmentId: string;
  date: Date;
  time: string;
  timezonePro: string;
  meetLink?: string | null;
  googleEventId?: string | null;
  durationMinutes: number;
}) {
  const resolved = await resolveGoogleEventIdForAppointment(params);

  if (resolved.error) return { error: resolved.error };
  if (!resolved.eventId) return {};

  const canceled = await cancelGoogleMeetEvent(resolved.eventId);

  if (!canceled) {
    console.error("[CANCEL_GOOGLE_MEET_EVENT_FAILED]", {
      appointmentId: params.appointmentId,
      googleEventId: resolved.eventId,
    });

    return {
      error:
        "Nao foi possivel cancelar o evento no Google Calendar. A consulta nao foi cancelada.",
    };
  }

  return {};
}

const terminalStatuses = [
  "CANCELLING",
  "RESCHEDULING",
  "CANCELED",
  "COMPLETED",
  "REFUNDED",
  "NO_SHOW",
  "DISPUTED",
  "MEETING_FAILED",
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
        durationMinutes: true,
        timezonePro: true,
        price: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        meetLink: true,
        googleEventId: true,
        notes: true,
        patient: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
      },
    });

    if (!appointment) throw new Error("Consulta nao encontrada.");

    if (appointment.patientId !== session.user.id) {
      throw new Error("Voce nao tem permissao para cancelar esta consulta.");
    }

    if (!isHealthAppointmentStatusCancellable(appointment.status)) {
      throw new Error("Apenas consultas agendadas podem ser canceladas.");
    }

    const scheduledAt = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

    if (!scheduledAt || scheduledAt <= new Date()) {
      throw new Error("Nao e possivel cancelar uma consulta passada.");
    }

    const twentyFourHoursFromNow = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    if (scheduledAt < twentyFourHoursFromNow) {
      const googleCancel = await cancelGoogleMeetForAppointment({
        appointmentId: appointment.id,
        date: appointment.date,
        time: appointment.time,
        timezonePro: appointment.timezonePro,
        meetLink: appointment.meetLink,
        googleEventId: appointment.googleEventId,
        durationMinutes: appointment.durationMinutes,
      });

      if (googleCancel.error) throw new Error(googleCancel.error);

      await db.$transaction(async (tx) => {
        const freshAppointment = await tx.appointment.findUnique({
          where: { id: appointment.id },
          select: {
            id: true,
            date: true,
            time: true,
            timezonePro: true,
            status: true,
            professionalId: true,
            stripeSessionId: true,
            notes: true,
          },
        });

        if (!freshAppointment) throw new Error("Consulta nao encontrada.");

        if (!isHealthAppointmentStatusCancellable(freshAppointment.status)) {
          throw new Error("Apenas consultas agendadas podem ser canceladas.");
        }

        const freshScheduledAt = getAppointmentStartAt({
          date: freshAppointment.date,
          time: freshAppointment.time,
          timeZone: freshAppointment.timezonePro,
        });

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
        await enqueueCancellationEmails(tx, {
          appointmentId: appointment.id,
          cancellationEventId: `late:${appointment.id}`,
          patient: { id: appointment.patientId, ...appointment.patient },
          professional: {
            id: appointment.professionalId,
            ...appointment.professional,
          },
          date: appointment.date,
          time: appointment.time,
          price: appointment.price,
          reason: normalizedReason || undefined,
          canceledBy: "patient",
          refundRequested: false,
          lateCancelFeeApplied: true,
        });
      });

      revalidateHealthAppointmentPaths(appointment.professionalId);

      return { success: true };
    }

    if (!appointment.stripeSessionId) {
      throw new Error("Consulta sem referencia de pagamento Stripe.");
    }

    const cancellation = await requestAppointmentCancellation({
      appointmentId: appointment.id,
      requestedById: session.user.id,
      initiator: "PATIENT",
      reason: normalizedReason,
    });
    const result = await processAppointmentCancellation(cancellation.id);

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return {
      success: true,
      processing: result.status !== "COMPLETED",
    };
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
        durationMinutes: true,
        timezonePro: true,
        price: true,
        status: true,
        patientId: true,
        professionalId: true,
        stripeSessionId: true,
        meetLink: true,
        googleEventId: true,
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

    const cancellation = await requestAppointmentCancellation({
      appointmentId: appointment.id,
      requestedById: session.user.id,
      initiator: "PROFESSIONAL",
      reason: normalizedReason,
    });
    const result = await processAppointmentCancellation(cancellation.id);

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return {
      success: true,
      processing: result.status !== "COMPLETED",
    };
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
        timezonePro: true,
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

    const scheduledAt = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

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

      await enqueueAdminNotificationEmails(tx, {
        eventType: "ADMIN_HEALTH_DISPUTE_OPENED",
        entityType: "HEALTH_APPOINTMENT",
        entityId: freshAppointment.id,
        templateKey: "admin.dispute.alert",
        roles: ["OWNER", "SUPPORT"],
        title: "Novo caso administrativo",
        summary: "Um novo caso exige analise no painel autenticado.",
        lines: [
          "Um novo caso foi aberto e precisa de acompanhamento.",
          "Os dados completos permanecem restritos ao painel administrativo.",
        ],
        details: [
          { label: "Consulta", value: freshAppointment.id },
          {
            label: "Categoria",
            value:
              healthReasonCategoryForEmail(normalizedReason) ||
              "Detalhes disponiveis no painel",
          },
        ],
        actionPath: `/dashboard/admin/disputas/health/${freshAppointment.id}`,
        actorId: session.user.id,
        notification: {
          title: "Disputa Online aberta",
          message: "Uma disputa de consulta online precisa de mediacao.",
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
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);

  const rateLimitError = await consumeRateLimit({
    key: `admin:health-dispute-decision:user:${admin.id}`,
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

  const reasonResult = validateAdminDecisionReason(reason);
  if (!reasonResult.success) {
    return { error: reasonResult.error };
  }
  const normalizedReason = reasonResult.value;

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

    await claimHealthDisputeDecision({
      appointmentId: appointment.id,
      decision,
      adminId: admin.id,
    });

    let refundId: string | undefined;

    await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "Appointment"
        WHERE "id" = ${appointment.id}
        FOR UPDATE
      `;

      const freshAppointment = await tx.appointment.findUnique({
        where: { id: appointment.id },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
          disputeDecisionClaim: true,
        },
      });

      if (!freshAppointment) throw new Error("Consulta nao encontrada.");

      if (freshAppointment.status !== "DISPUTED") {
        throw new Error("Apenas consultas em disputa podem ser resolvidas.");
      }
      if (freshAppointment.disputeDecisionClaim !== decision) {
        throw new Error("A decisao da disputa foi alterada por outra operacao.");
      }

      const resolvedAt = new Date().toLocaleString("pt-BR");

      if (decision === "REFUND_PATIENT") {
        if (!freshAppointment.stripeSessionId) {
          throw new Error("Consulta sem referencia de pagamento Stripe.");
        }

        const refund = await refundStripeCheckoutSession(
          freshAppointment.stripeSessionId,
          `health-appointment-admin-dispute-refund-${freshAppointment.id}`,
        );
        refundId = refund.id;

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
          actorId: admin.id,
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

        await enqueueAdminNotificationEmails(tx, {
          eventType: "ADMIN_HEALTH_DISPUTE_RESOLVED_REFUND_PATIENT",
          entityType: "HEALTH_APPOINTMENT",
          entityId: freshAppointment.id,
          templateKey: "admin.dispute.alert",
          roles: ["OWNER", "SUPPORT"],
          title: "Caso administrativo atualizado",
          summary: "Uma decisao foi registrada no painel autenticado.",
          lines: [
            "Uma decisao administrativa foi registrada.",
            "Consulte o painel autenticado para os detalhes e o andamento financeiro.",
          ],
          details: [
            { label: "Consulta", value: freshAppointment.id },
            { label: "Decisao", value: decision },
          ],
          actionPath: `/dashboard/admin/disputas/health/${freshAppointment.id}`,
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
        actorId: admin.id,
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

      await enqueueAppointmentCompletedEmail(tx, {
        appointmentId: appointment.id,
        patient: { id: appointment.patientId, ...appointment.patient },
        professional: {
          id: appointment.professionalId,
          ...appointment.professional,
        },
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
      });
      await enqueueAdminNotificationEmails(tx, {
        eventType: "ADMIN_HEALTH_DISPUTE_RESOLVED_RELEASE_PROFESSIONAL",
        entityType: "HEALTH_APPOINTMENT",
        entityId: freshAppointment.id,
        templateKey: "admin.dispute.alert",
        roles: ["OWNER", "SUPPORT"],
        title: "Caso administrativo atualizado",
        summary: "Uma decisao foi registrada no painel autenticado.",
        lines: [
          "Uma decisao administrativa foi registrada.",
          "Consulte o painel autenticado para os detalhes e o andamento financeiro.",
        ],
        details: [
          { label: "Consulta", value: freshAppointment.id },
          { label: "Decisao", value: decision },
        ],
        actionPath: `/dashboard/admin/disputas/health/${freshAppointment.id}`,
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 30_000,
    });

    revalidateHealthAppointmentPaths(appointment.professionalId);

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
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          date: true,
          time: true,
          durationMinutes: true,
          timezonePro: true,
          price: true,
          status: true,
          patientId: true,
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

      const completionAt = getAppointmentCompletionAt({
        date: appointment.date,
        time: appointment.time,
        timeZone: appointment.timezonePro,
        durationMinutes: appointment.durationMinutes,
      });

      if (!completionAt) {
        throw new Error(
          "Nao foi possivel validar o horario final desta consulta.",
        );
      }

      if (completionAt.getTime() > Date.now()) {
        throw new Error(
          "A consulta so pode ser concluida depois do termino previsto da sessao.",
        );
      }

      const claimedAppointment = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          professionalId: session.user.id,
          status: "CONFIRMED",
        },
        data: { status: "COMPLETED" },
      });

      if (claimedAppointment.count !== 1) {
        throw new Error(
          "A consulta mudou de status e nao pode mais ser concluida.",
        );
      }

      await releaseAppointmentEscrow(tx, appointment);

      await enqueueAppointmentCompletedEmail(tx, {
        appointmentId: appointment.id,
        patient: { id: appointment.patientId, ...appointment.patient },
        professional: {
          id: appointment.professionalId,
          ...appointment.professional,
        },
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
      });

      return appointment;
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
          durationMinutes: true,
          timezonePro: true,
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

      const completionAt = getAppointmentCompletionAt({
        date: appointment.date,
        time: appointment.time,
        timeZone: appointment.timezonePro,
        durationMinutes: appointment.durationMinutes,
      });

      if (!completionAt) {
        throw new Error(
          "Nao foi possivel validar o horario final desta consulta.",
        );
      }

      if (completionAt.getTime() > Date.now()) {
        throw new Error(
          "A ausencia so pode ser marcada depois do termino previsto da sessao.",
        );
      }

      const claimedAppointment = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          professionalId: session.user.id,
          status: "CONFIRMED",
        },
        data: { status: "NO_SHOW" },
      });

      if (claimedAppointment.count !== 1) {
        throw new Error(
          "A consulta mudou de status e nao pode ser marcada como ausencia.",
        );
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
        data: { notes },
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

  const appointments = await db.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { lte: now },
    },
    select: {
      id: true,
      date: true,
      time: true,
      durationMinutes: true,
      timezonePro: true,
      price: true,
      patientId: true,
      professionalId: true,
      stripeSessionId: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
    },
  });

  let completed = 0;
  const failed: Array<{ appointmentId: string; error: string }> = [];

  for (const appointment of appointments) {
    const completionAt = getAppointmentCompletionAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
      durationMinutes: appointment.durationMinutes,
    });

    if (!completionAt) {
      failed.push({
        appointmentId: appointment.id,
        error: "Nao foi possivel validar o termino da consulta.",
      });
      continue;
    }

    const releaseAt = new Date(completionAt.getTime() + 24 * 60 * 60 * 1000);
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

        await enqueueAppointmentCompletedEmail(tx, {
          appointmentId: appointment.id,
          patient: { id: appointment.patientId, ...appointment.patient },
          professional: {
            id: appointment.professionalId,
            ...appointment.professional,
          },
          date: appointment.date,
          time: appointment.time,
          price: appointment.price,
        });

        return true;
      });

      if (didComplete) {
        completed += 1;
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
): Promise<{ success?: boolean; processing?: boolean; error?: string }> {
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
        durationMinutes: true,
        timezonePro: true,
        status: true,
        professionalId: true,
        patientId: true,
        stripeSessionId: true,
        price: true,
        notes: true,
        meetLink: true,
        googleEventId: true,
        patient: { select: { name: true, email: true } },
        professional: {
          select: { name: true, email: true },
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

    const currentDateTime = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

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

    const newDateTime = getAppointmentStartAt({
      date: newDate,
      time: newTime,
      timeZone: appointment.timezonePro,
    });

    if (!newDateTime) {
      return { error: "Data, horario ou fuso invalido." };
    }

    if (newDateTime <= new Date()) {
      return { error: "O novo horario deve ser no futuro." };
    }

    const hoursUntilNew =
      (newDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

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

    const duration = appointment.durationMinutes;
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
        status: {
          in: [
            "PENDING_PAYMENT",
            "PAID",
            "MEETING_PENDING",
            "MEETING_REQUIRES_ATTENTION",
            "CONFIRMED",
            "CANCELLING",
            "RESCHEDULING",
          ],
        },
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

    const process = await requestAppointmentReschedule({
      appointmentId: appointment.id,
      requestedById: session.user.id,
      newDate: parsedNewDate.dateOnly,
      newTime,
    });
    const result = await processAppointmentReschedule(process.id);

    revalidateHealthAppointmentPaths(appointment.professionalId);

    return {
      success: true,
      processing: result.status !== "COMPLETED",
    };
  } catch (error) {
    console.error("[RESCHEDULE_APPOINTMENT_ERROR]", error);
    return { error: "Erro ao reagendar consulta." };
  }
}

