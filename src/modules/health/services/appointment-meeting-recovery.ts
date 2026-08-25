import "server-only";

import { createHash, randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import {
  createGoogleMeetEvent,
  getGoogleMeetEvent,
  requestGoogleMeetConference,
} from "@/modules/health/services/google-meet-service";
import {
  enqueueHealthOperationalAttentionEmail,
  enqueuePaymentConfirmedEmails,
} from "@/modules/health/services/transactional-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getAppointmentStartAt } from "@/modules/health/lib/appointment-completion-time";

const MAX_MEET_ATTEMPTS = 5;
const PROCESSING_LOCK_MINUTES = 10;
const PENDING_POLL_DELAY_MINUTES = 2;
const RETRY_DELAYS_MINUTES = [2, 5, 15, 30, 60] as const;

type MeetingOperation =
  | "CREATE_EVENT"
  | "POLL_EVENT"
  | "RETRY_CONFERENCE"
  | "ADMIN_RETRY"
  | "MANUAL_LINK";

export type MeetingRecoveryResult = {
  status: "CONFIRMED" | "PENDING" | "REQUIRES_ATTENTION" | "FAILED";
  appointmentId: string;
  error?: string;
};

function createMeetRequestId(stripeSessionId: string) {
  return `mwc-${createHash("sha256")
    .update(stripeSessionId)
    .digest("hex")
    .slice(0, 24)}`;
}

function createCalendarEventId(stripeSessionId: string) {
  // Google Calendar aceita apenas caracteres base32hex (a-v e 0-9).
  // SHA-256 em hexadecimal atende ao formato e torna a criacao idempotente.
  return `mwc${createHash("sha256")
    .update(`calendar-event:${stripeSessionId}`)
    .digest("hex")
    .slice(0, 40)}`;
}

function createRetryMeetRequestId() {
  return `mwc-retry-${randomUUID()}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function retryAt(attemptCount: number, now = new Date()) {
  const delay =
    RETRY_DELAYS_MINUTES[
      Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_MINUTES.length - 1)
    ];
  return addMinutes(now, delay);
}

async function recordMeetingAttempt(
  tx: Prisma.TransactionClient,
  input: {
    appointmentId: string;
    operation: MeetingOperation;
    outcome: "PENDING" | "READY" | "FAILED";
    requestId: string | null;
    googleEventId: string | null;
    providerStatus?: string | null;
    errorMessage?: string | null;
  },
) {
  await tx.appointmentMeetingAttempt.create({ data: input });
}

async function notifyAdmins({
  appointmentId,
  title,
  message,
  eventType,
}: {
  appointmentId: string;
  title: string;
  message: string;
  eventType: string;
}) {
  const admins = await db.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: { id: true, email: true, name: true, displayName: true },
  });

  if (admins.length === 0) {
    throw new Error("Nenhum administrador ativo para receber o alerta.");
  }

  await db.$transaction(async (tx) => {
    for (const admin of admins) {
      await upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType,
        title,
        message,
        link: "/dashboard/admin/reconciliacoes",
        entityType: "APPOINTMENT",
        entityId: appointmentId,
      }, tx);
      await enqueueHealthOperationalAttentionEmail(tx, {
        eventType,
        entityType: "APPOINTMENT",
        entityId: appointmentId,
        appointmentId,
        title,
        summary: message,
        recipient: admin,
      });
    }
  });
}

async function sendMeetingAttentionNotifications(appointment: {
  id: string;
  patientId: string;
  professionalId: string;
  meetLastError: string | null;
}) {
  const results = await Promise.allSettled([
    upsertNotification({
      userId: appointment.patientId,
      type: "WARNING",
      eventType: "HEALTH_MEETING_REQUIRES_ATTENTION",
      title: "Sala online em atendimento",
      message:
        "Seu pagamento e sua consulta continuam protegidos. Nossa equipe foi avisada para concluir a preparacao da sala online.",
      link: "/agendar-consulta/historico",
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    }),
    upsertNotification({
      userId: appointment.professionalId,
      type: "WARNING",
      eventType: "HEALTH_MEETING_REQUIRES_ATTENTION",
      title: "Sala online requer suporte",
      message:
        "A consulta continua agendada e o pagamento permanece protegido. A equipe administrativa foi avisada.",
      link: "/agendar-consulta/dashboard-profissional",
      entityType: "APPOINTMENT",
      entityId: appointment.id,
    }),
    notifyAdmins({
      appointmentId: appointment.id,
      title: "Sala online requer intervencao",
      message:
        "A consulta atingiu o limite de tentativas tecnicas sem ser cancelada ou reembolsada.",
      eventType: "HEALTH_MEETING_REQUIRES_ATTENTION",
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "[HEALTH_MEETING_ATTENTION_NOTIFICATION_ERROR]",
        result.reason,
      );
    }
  }

  return results.every((result) => result.status === "fulfilled");
}

async function requireMeetingAttention(appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      professionalId: true,
      patientId: true,
      meetLastError: true,
      meetAttentionRequiredAt: true,
      meetAttentionAlertedAt: true,
    },
  });

  if (!appointment) {
    return { status: "FAILED", appointmentId, error: "Agendamento nao encontrado." } as const;
  }

  if (appointment.status === "MEETING_REQUIRES_ATTENTION") {
    if (!appointment.meetAttentionAlertedAt) {
      const notified = await sendMeetingAttentionNotifications(appointment);
      await db.appointment.updateMany({
        where: {
          id: appointment.id,
          status: "MEETING_REQUIRES_ATTENTION",
          meetAttentionAlertedAt: null,
        },
        data: notified
          ? { meetAttentionAlertedAt: new Date(), meetNextAttemptAt: null }
          : { meetNextAttemptAt: addMinutes(new Date(), 5) },
      });
    }
    return { status: "REQUIRES_ATTENTION", appointmentId } as const;
  }

  if (appointment.status !== "MEETING_PENDING") {
    return appointment.status === "CONFIRMED"
      ? ({ status: "CONFIRMED", appointmentId } as const)
      : ({
          status: "FAILED",
          appointmentId,
          error: "O estado atual da consulta nao permite processar a sala.",
        } as const);
  }

  const attentionRequiredAt = new Date();
  const updated = await db.appointment.updateMany({
    where: { id: appointment.id, status: "MEETING_PENDING" },
    data: {
      status: "MEETING_REQUIRES_ATTENTION",
      meetGenerationStatus: "REQUIRES_ATTENTION",
      meetNextAttemptAt: attentionRequiredAt,
      meetProcessingStartedAt: null,
      meetAttentionRequiredAt: attentionRequiredAt,
      meetAttentionAlertedAt: null,
    },
  });

  if (updated.count === 1) {
    const notified = await sendMeetingAttentionNotifications(appointment);
    await db.appointment.updateMany({
      where: {
        id: appointment.id,
        status: "MEETING_REQUIRES_ATTENTION",
        meetAttentionRequiredAt: attentionRequiredAt,
      },
      data: notified
        ? { meetAttentionAlertedAt: new Date(), meetNextAttemptAt: null }
        : { meetNextAttemptAt: addMinutes(new Date(), 5) },
    });
  }

  return { status: "REQUIRES_ATTENTION", appointmentId: appointment.id } as const;
}

export async function processAppointmentMeeting(
  appointmentId: string,
): Promise<MeetingRecoveryResult> {
  const now = new Date();
  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      meetRetryCount: true,
      meetLink: true,
      meetNextAttemptAt: true,
      meetAttentionAlertedAt: true,
    },
  });

  if (!current) {
    return { status: "FAILED", appointmentId, error: "Agendamento nao encontrado." };
  }
  if (current.status === "CONFIRMED" && current.meetLink) {
    return { status: "CONFIRMED", appointmentId };
  }
  if (current.status === "MEETING_FAILED") {
    return { status: "FAILED", appointmentId };
  }
  if (current.status === "MEETING_REQUIRES_ATTENTION") {
    return requireMeetingAttention(appointmentId);
  }
  if (current.meetRetryCount >= MAX_MEET_ATTEMPTS) {
    return requireMeetingAttention(appointmentId);
  }
  if (current.status !== "MEETING_PENDING") {
    return { status: "FAILED", appointmentId, error: "Status nao permite criar reuniao." };
  }
  if (current.meetNextAttemptAt && current.meetNextAttemptAt > now) {
    return { status: "PENDING", appointmentId };
  }

  const claimedAt = now;
  const staleBefore = new Date(
    claimedAt.getTime() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const claim = await db.appointment.updateMany({
    where: {
      id: appointmentId,
      status: "MEETING_PENDING",
      meetRetryCount: { lt: MAX_MEET_ATTEMPTS },
      AND: [
        {
          OR: [
            { meetProcessingStartedAt: null },
            { meetProcessingStartedAt: { lte: staleBefore } },
          ],
        },
        {
          OR: [
            { meetNextAttemptAt: null },
            { meetNextAttemptAt: { lte: claimedAt } },
          ],
        },
      ],
    },
    data: {
      meetProcessingStartedAt: claimedAt,
      meetLastAttemptAt: claimedAt,
    },
  });

  if (claim.count !== 1) {
    return { status: "PENDING", appointmentId };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      stripeSessionId: true,
      meetRetryCount: true,
      googleEventId: true,
      meetRequestId: true,
      meetGenerationStatus: true,
      date: true,
      time: true,
      durationMinutes: true,
      timezonePro: true,
      price: true,
      patientId: true,
      professionalId: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
    },
  });

  if (!appointment) {
    return {
      status: "FAILED",
      appointmentId,
      error: "Agendamento nao encontrado apos adquirir o processamento.",
    };
  }

  if (!appointment.stripeSessionId) {
    const message = "Sessao Stripe ausente.";
    const nextAttemptCount = appointment.meetRetryCount + 1;
    await db.$transaction(async (tx) => {
      const updated = await tx.appointment.updateMany({
        where: {
          id: appointmentId,
          status: "MEETING_PENDING",
          meetProcessingStartedAt: claimedAt,
        },
        data: {
          meetGenerationStatus:
            nextAttemptCount >= MAX_MEET_ATTEMPTS
              ? "FAILED"
              : "RETRY_SCHEDULED",
          meetNextAttemptAt:
            nextAttemptCount >= MAX_MEET_ATTEMPTS
              ? null
              : retryAt(nextAttemptCount, claimedAt),
          meetProcessingStartedAt: null,
          meetLastError: message,
          meetRetryCount: { increment: 1 },
        },
      });
      if (updated.count === 1) {
        await recordMeetingAttempt(tx, {
          appointmentId,
          operation: "CREATE_EVENT",
          outcome: "FAILED",
          requestId: null,
          googleEventId: null,
          providerStatus: "MISSING_STRIPE_SESSION",
          errorMessage: message,
        });
      }
    });

    if (nextAttemptCount >= MAX_MEET_ATTEMPTS) {
      return requireMeetingAttention(appointmentId);
    }

    return { status: "PENDING", appointmentId, error: message };
  }

  let operation: MeetingOperation = appointment.googleEventId
    ? "POLL_EVENT"
    : "CREATE_EVENT";
  let requestId =
    appointment.meetRequestId ??
    createMeetRequestId(appointment.stripeSessionId);
  let googleEventId = appointment.googleEventId;
  let failureProviderStatus: string | null = null;

  try {
    const startTime = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

    if (!startTime) {
      throw new Error("Data, horario ou fuso da consulta sao invalidos.");
    }

    if (!appointment.patient.email || !appointment.professional.email) {
      throw new Error(
        "Paciente ou profissional sem email para receber a sala online.",
      );
    }

    let meetEvent = appointment.googleEventId
      ? await getGoogleMeetEvent(appointment.googleEventId)
      : await createGoogleMeetEvent({
          summary: `MWC Online - Consulta com ${appointment.professional.name ?? "profissional"}`,
          description: `Consulta MWC Online confirmada pelo pagamento Stripe ${appointment.stripeSessionId}.`,
          startTime,
          endTime: new Date(
            startTime.getTime() + appointment.durationMinutes * 60 * 1000,
          ),
          attendees: [
            appointment.patient.email,
            appointment.professional.email,
          ],
          eventId: createCalendarEventId(appointment.stripeSessionId),
          requestId,
        });

    googleEventId = meetEvent.googleEventId ?? googleEventId;

    if (
      meetEvent.status === "FAILED" &&
      meetEvent.failureKind === "CONFERENCE_CREATION_FAILED" &&
      googleEventId
    ) {
      const conferenceFailure = meetEvent;
      const failedRequestId = requestId;
      const storedRetryWasExplicitlyRejected =
        Boolean(conferenceFailure.providerRequestId) &&
        conferenceFailure.providerRequestId === appointment.meetRequestId;
      const retryRequestId =
        appointment.meetGenerationStatus === "RETRY_SCHEDULED" &&
        appointment.meetRequestId &&
        !storedRetryWasExplicitlyRejected
          ? appointment.meetRequestId
          : createRetryMeetRequestId();

      await db.$transaction(async (tx) => {
        const updated = await tx.appointment.updateMany({
          where: {
            id: appointment.id,
            status: "MEETING_PENDING",
            meetProcessingStartedAt: claimedAt,
          },
          data: {
            googleEventId,
            meetRequestId: retryRequestId,
            meetGenerationStatus: "RETRY_SCHEDULED",
            meetNextAttemptAt: claimedAt,
            meetLastError: conferenceFailure.error,
          },
        });
        if (updated.count === 1) {
          await recordMeetingAttempt(tx, {
            appointmentId: appointment.id,
            operation,
            outcome: "FAILED",
            requestId: failedRequestId,
            googleEventId,
            providerStatus: conferenceFailure.failureKind,
            errorMessage: conferenceFailure.error,
          });
        }
      });

      requestId = retryRequestId;
      operation = "RETRY_CONFERENCE";
      meetEvent = await requestGoogleMeetConference({
        eventId: googleEventId,
        requestId,
      });
      googleEventId = meetEvent.googleEventId ?? googleEventId;
    }

    if (meetEvent.status === "PENDING") {
      await db.$transaction(async (tx) => {
        const updated = await tx.appointment.updateMany({
          where: {
            id: appointment.id,
            status: "MEETING_PENDING",
            meetProcessingStartedAt: claimedAt,
          },
          data: {
            googleEventId: meetEvent.googleEventId,
            meetRequestId: requestId,
            meetGenerationStatus: "PENDING",
            meetNextAttemptAt: addMinutes(
              claimedAt,
              PENDING_POLL_DELAY_MINUTES,
            ),
            meetProcessingStartedAt: null,
            meetLastError: null,
          },
        });

        if (updated.count === 1) {
          await recordMeetingAttempt(tx, {
            appointmentId: appointment.id,
            operation,
            outcome: "PENDING",
            requestId,
            googleEventId: meetEvent.googleEventId,
            providerStatus: "pending",
          });
        }
      });

      return { status: "PENDING", appointmentId: appointment.id };
    }

    if (meetEvent.status === "FAILED") {
      failureProviderStatus = meetEvent.failureKind;
      throw new Error(meetEvent.error);
    }

    await db.$transaction(async (tx) => {
      const updated = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          status: "MEETING_PENDING",
          meetProcessingStartedAt: claimedAt,
        },
        data: {
          status: "CONFIRMED",
          meetLink: meetEvent.meetLink,
          googleEventId: meetEvent.googleEventId,
          meetRequestId: requestId,
          meetGenerationStatus: "READY",
          meetNextAttemptAt: null,
          meetProcessingStartedAt: null,
          meetLastError: null,
        },
      });

      if (updated.count === 1) {
        await recordMeetingAttempt(tx, {
          appointmentId: appointment.id,
          operation,
          outcome: "READY",
          requestId,
          googleEventId: meetEvent.googleEventId,
          providerStatus: "success",
        });
        await enqueuePaymentConfirmedEmails(tx, {
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
        await upsertNotification({
          userId: appointment.patientId,
          type: "SUCCESS",
          eventType: "HEALTH_MEETING_READY",
          title: "Consulta confirmada",
          message: "A sala online foi criada e ja esta disponivel no seu historico.",
          link: "/agendar-consulta/historico",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
        }, tx);
        await upsertNotification({
          userId: appointment.professionalId,
          type: "SUCCESS",
          eventType: "HEALTH_MEETING_READY",
          title: "Nova consulta confirmada",
          message: "A sala online foi criada e a consulta esta na sua agenda.",
          link: "/agendar-consulta/dashboard-profissional",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
        }, tx);
      }

      return updated;
    });

    return { status: "CONFIRMED", appointmentId: appointment.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no Google Meet.";
    const nextAttemptCount = appointment.meetRetryCount + 1;

    await db.$transaction(async (tx) => {
      const updated = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          status: "MEETING_PENDING",
          meetProcessingStartedAt: claimedAt,
        },
        data: {
          googleEventId,
          meetRequestId: requestId,
          meetGenerationStatus:
            nextAttemptCount >= MAX_MEET_ATTEMPTS
              ? "FAILED"
              : "RETRY_SCHEDULED",
          meetNextAttemptAt:
            nextAttemptCount >= MAX_MEET_ATTEMPTS
              ? null
              : retryAt(nextAttemptCount, claimedAt),
          meetRetryCount: { increment: 1 },
          meetProcessingStartedAt: null,
          meetLastError: message,
        },
      });

      if (updated.count === 1) {
        await recordMeetingAttempt(tx, {
          appointmentId: appointment.id,
          operation,
          outcome: "FAILED",
          requestId,
          googleEventId,
          providerStatus: failureProviderStatus ?? "APPLICATION_ERROR",
          errorMessage: message,
        });
      }
    });

    if (nextAttemptCount >= MAX_MEET_ATTEMPTS) {
      return requireMeetingAttention(appointment.id);
    }

    return { status: "PENDING", appointmentId: appointment.id, error: message };
  }
}

export async function retryAppointmentMeetingAdministratively(
  appointmentId: string,
): Promise<MeetingRecoveryResult> {
  const retryRequestedAt = new Date();
  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      googleEventId: true,
      meetRequestId: true,
    },
  });

  if (current?.status !== "MEETING_REQUIRES_ATTENTION") {
    throw new Error(
      "A consulta nao esta aguardando intervencao ou ja foi tratada.",
    );
  }

  const reset = await db.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: "MEETING_REQUIRES_ATTENTION",
      },
      data: {
        status: "MEETING_PENDING",
        meetGenerationStatus: "RETRY_SCHEDULED",
        meetNextAttemptAt: retryRequestedAt,
        meetRetryCount: 0,
        meetProcessingStartedAt: null,
        meetLastError: null,
        meetAttentionRequiredAt: null,
        meetAttentionAlertedAt: null,
      },
    });

    if (updated.count === 1) {
      await recordMeetingAttempt(tx, {
        appointmentId,
        operation: "ADMIN_RETRY",
        outcome: "PENDING",
        requestId: current.meetRequestId,
        googleEventId: current.googleEventId,
        providerStatus: "ADMIN_REQUESTED",
      });
    }

    return updated;
  });

  if (reset.count !== 1) {
    throw new Error(
      "A consulta nao esta aguardando intervencao ou ja foi tratada.",
    );
  }

  return processAppointmentMeeting(appointmentId);
}

function normalizeManualMeetingLink(value: string) {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.hostname !== "meet.google.com" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname === "/"
    ) {
      return null;
    }

    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

export async function registerManualAppointmentMeetingLink(
  appointmentId: string,
  rawMeetLink: string,
): Promise<MeetingRecoveryResult> {
  const meetLink = normalizeManualMeetingLink(rawMeetLink);
  if (!meetLink) {
    throw new Error("Informe um link valido do Google Meet.");
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      patientId: true,
      professionalId: true,
      date: true,
      time: true,
      price: true,
      googleEventId: true,
      meetRequestId: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
    },
  });

  if (!appointment) throw new Error("Agendamento nao encontrado.");

  const confirmed = await db.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: {
        id: appointment.id,
        status: {
          in: ["MEETING_PENDING", "MEETING_REQUIRES_ATTENTION"],
        },
      },
      data: {
        status: "CONFIRMED",
        meetLink,
        meetGenerationStatus: "READY",
        meetNextAttemptAt: null,
        meetProcessingStartedAt: null,
        meetLastError: null,
      },
    });

    if (updated.count === 1) {
      await recordMeetingAttempt(tx, {
        appointmentId: appointment.id,
        operation: "MANUAL_LINK",
        outcome: "READY",
        requestId: appointment.meetRequestId,
        googleEventId: appointment.googleEventId,
        providerStatus: "ADMIN_PROVIDED",
      });
      await enqueuePaymentConfirmedEmails(tx, {
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
      await upsertNotification({
        userId: appointment.patientId,
        type: "SUCCESS",
        eventType: "HEALTH_MEETING_READY",
        title: "Consulta confirmada",
        message: "A sala online foi preparada e ja esta disponivel no seu historico.",
        link: "/agendar-consulta/historico",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
      }, tx);
      await upsertNotification({
        userId: appointment.professionalId,
        type: "SUCCESS",
        eventType: "HEALTH_MEETING_READY",
        title: "Consulta confirmada",
        message: "A sala online foi preparada e esta disponivel na sua agenda.",
        link: "/agendar-consulta/dashboard-profissional",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
      }, tx);
    }

    return updated;
  });

  if (confirmed.count !== 1) {
    throw new Error("A consulta ja foi tratada ou nao aceita um link manual.");
  }

  return { status: "CONFIRMED", appointmentId: appointment.id };
}

export async function recoverPendingAppointmentMeetings(limit = 25) {
  const now = new Date();
  const appointments = await db.appointment.findMany({
    where: {
      OR: [
        {
          status: "MEETING_PENDING",
          meetNextAttemptAt: { lte: now },
        },
        {
          status: "MEETING_REQUIRES_ATTENTION",
          meetAttentionAlertedAt: null,
          meetNextAttemptAt: { lte: now },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: { id: true },
  });

  const results = [];
  for (const appointment of appointments) {
    results.push(await processAppointmentMeeting(appointment.id));
  }

  const recovered = results.filter(
    (result) => result.status === "CONFIRMED",
  ).length;
  const failed = results.filter(
    (result) =>
      result.status === "FAILED" ||
      result.status === "REQUIRES_ATTENTION" ||
      Boolean(result.error),
  ).length;

  return {
    processed: results.length,
    recovered,
    confirmed: recovered,
    pending: results.length - recovered - failed,
    requiresAttention: results.filter(
      (result) => result.status === "REQUIRES_ATTENTION",
    ).length,
    failed,
  };
}
