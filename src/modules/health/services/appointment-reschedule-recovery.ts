import "server-only";

import { db } from "@/lib/prisma";
import { getAppointmentStartAt } from "@/modules/health/lib/appointment-completion-time";
import {
  findGoogleMeetEventForCancellation,
  updateGoogleMeetEvent,
} from "@/modules/health/services/google-meet-service";
import {
  enqueueHealthOperationalAttentionEmail,
  enqueueRescheduleEmail,
} from "@/modules/health/services/transactional-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

const MAX_ATTEMPTS = 3;
const PROCESSING_LOCK_MINUTES = 10;
const RESERVATION_DAYS = 30;
const BACKOFF_MINUTES = [1, 5, 15] as const;

type RequestRescheduleInput = {
  appointmentId: string;
  requestedById: string;
  newDate: Date;
  newTime: string;
};

export type RescheduleRecoveryResult = {
  appointmentId: string;
  status: "COMPLETED" | "PENDING" | "RECONCILIATION_REQUIRED" | "IGNORED";
  error?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido.";
}

function reservationExpiry() {
  return new Date(Date.now() + RESERVATION_DAYS * 24 * 60 * 60 * 1000);
}

export async function requestAppointmentReschedule({
  appointmentId,
  requestedById,
  newDate,
  newTime,
}: RequestRescheduleInput) {
  try {
    return await db.$transaction(async (tx) => {
      const existingProcess = await tx.appointmentRescheduleProcess.findFirst({
        where: {
          appointmentId,
          status: { not: "COMPLETED" },
        },
        select: { id: true, status: true },
      });

      if (existingProcess) return existingProcess;

      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          professionalId: requestedById,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          patientId: true,
          professionalId: true,
          date: true,
          time: true,
        },
      });

      if (!appointment) {
        throw new Error(
          "A consulta mudou de estado e nao pode mais ser reagendada.",
        );
      }

      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          professionalId: appointment.professionalId,
          date: newDate,
          time: newTime,
          id: { not: appointment.id },
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
        },
        select: { id: true },
      });

      if (conflictingAppointment) {
        throw new Error("O novo horario ja esta reservado.");
      }

      await tx.appointmentHold.deleteMany({
        where: {
          professionalId: appointment.professionalId,
          date: newDate,
          time: newTime,
          expiresAt: { lte: new Date() },
        },
      });

      const reservation = await tx.appointmentHold.create({
        data: {
          professionalId: appointment.professionalId,
          patientId: appointment.patientId,
          date: newDate,
          time: newTime,
          expiresAt: reservationExpiry(),
        },
        select: { id: true },
      });

      const transitioned = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          professionalId: requestedById,
          status: "CONFIRMED",
          date: appointment.date,
          time: appointment.time,
        },
        data: { status: "RESCHEDULING" },
      });

      if (transitioned.count !== 1) {
        throw new Error("A consulta mudou durante o reagendamento.");
      }

      return tx.appointmentRescheduleProcess.create({
        data: {
          appointmentId: appointment.id,
          requestedById,
          reservationId: reservation.id,
          previousDate: appointment.date,
          previousTime: appointment.time,
          newDate,
          newTime,
          maxAttempts: MAX_ATTEMPTS,
        },
        select: { id: true, status: true },
      });
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error("O novo horario ja esta reservado.");
    }
    throw error;
  }
}

async function processCalendarStep(processId: string) {
  const process = await db.appointmentRescheduleProcess.findUnique({
    where: { id: processId },
    select: {
      calendarStatus: true,
      newDate: true,
      newTime: true,
      reservationId: true,
      appointment: {
        select: {
          id: true,
          date: true,
          time: true,
          timezonePro: true,
          durationMinutes: true,
          meetLink: true,
          googleEventId: true,
          patient: { select: { email: true } },
          professional: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!process || process.calendarStatus !== "PENDING") return;

  if (process.reservationId) {
    await db.appointmentHold.updateMany({
      where: { id: process.reservationId },
      data: { expiresAt: reservationExpiry() },
    });
  }

  const appointment = process.appointment;
  let eventId = appointment.googleEventId;

  if (!eventId && !appointment.meetLink) {
    await db.appointmentRescheduleProcess.update({
      where: { id: processId },
      data: {
        calendarStatus: "SKIPPED",
        calendarUpdatedAt: new Date(),
        calendarLastError: null,
      },
    });
    return;
  }

  if (!eventId && appointment.meetLink) {
    const previousStart = getAppointmentStartAt({
      date: appointment.date,
      time: appointment.time,
      timeZone: appointment.timezonePro,
    });

    if (!previousStart) {
      throw new Error("Horario atual da consulta e invalido.");
    }

    const lookup = await findGoogleMeetEventForCancellation({
      meetLink: appointment.meetLink,
      startTime: previousStart,
      endTime: new Date(
        previousStart.getTime() + appointment.durationMinutes * 60 * 1000,
      ),
    });

    if (lookup.status === "FAILED") throw new Error(lookup.error);
    if (lookup.status === "NOT_FOUND") {
      await db.appointmentRescheduleProcess.update({
        where: { id: processId },
        data: {
          calendarStatus: "SKIPPED",
          calendarUpdatedAt: new Date(),
          calendarLastError: null,
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

  if (!eventId) throw new Error("Evento do Google Calendar nao identificado.");

  const newStart = getAppointmentStartAt({
    date: process.newDate,
    time: process.newTime,
    timeZone: appointment.timezonePro,
  });

  if (!newStart) throw new Error("Novo horario da consulta e invalido.");

  const updated = await updateGoogleMeetEvent({
    eventId,
    summary: `MWC Online - Consulta com ${appointment.professional.name ?? "profissional"}`,
    description: "Consulta MWC Online reagendada pelo profissional.",
    startTime: newStart,
    endTime: new Date(
      newStart.getTime() + appointment.durationMinutes * 60 * 1000,
    ),
    attendees: [appointment.patient.email, appointment.professional.email].filter(
      (email): email is string => Boolean(email),
    ),
  });

  if (!updated) throw new Error("Falha ao atualizar o Google Calendar.");

  await db.appointmentRescheduleProcess.update({
    where: { id: processId },
    data: {
      calendarStatus: "COMPLETED",
      calendarUpdatedAt: new Date(),
      calendarLastError: null,
    },
  });
}

async function processDatabaseStep(processId: string) {
  return db.$transaction(async (tx) => {
    const process = await tx.appointmentRescheduleProcess.findUnique({
      where: { id: processId },
      select: {
        id: true,
        status: true,
        calendarStatus: true,
        databaseStatus: true,
        reservationId: true,
        previousDate: true,
        previousTime: true,
        newDate: true,
        newTime: true,
        appointment: {
          select: {
            id: true,
            status: true,
            professionalId: true,
            notes: true,
          },
        },
      },
    });

    if (!process || process.databaseStatus === "COMPLETED") return;
    if (!["COMPLETED", "SKIPPED"].includes(process.calendarStatus)) {
      throw new Error("O banco aguarda a atualizacao do Google Calendar.");
    }

    const conflict = await tx.appointment.findFirst({
      where: {
        professionalId: process.appointment.professionalId,
        date: process.newDate,
        time: process.newTime,
        id: { not: process.appointment.id },
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
      },
      select: { id: true },
    });

    if (conflict) {
      throw new Error("O novo horario foi ocupado e exige reconciliacao.");
    }

    const note = `Reagendado pelo profissional em ${new Date().toLocaleString("pt-BR")}. De ${process.previousDate.toLocaleDateString("pt-BR")} as ${process.previousTime} para ${process.newDate.toLocaleDateString("pt-BR")} as ${process.newTime}. Pagamento original mantido.`;
    const notes = process.appointment.notes
      ? `${process.appointment.notes}\n\n${note}`
      : note;
    const updated = await tx.appointment.updateMany({
      where: {
        id: process.appointment.id,
        status: "RESCHEDULING",
        date: process.previousDate,
        time: process.previousTime,
      },
      data: {
        status: "CONFIRMED",
        date: process.newDate,
        time: process.newTime,
        notes,
      },
    });

    if (updated.count !== 1) {
      throw new Error("A consulta mudou durante a finalizacao.");
    }

    await tx.appointmentRescheduleProcess.update({
      where: { id: process.id },
      data: {
        status: "COMPLETED",
        databaseStatus: "COMPLETED",
        databaseUpdatedAt: new Date(),
        databaseLastError: null,
        completedAt: new Date(),
        processingStartedAt: null,
        lastError: null,
        reservationId: null,
      },
    });

    if (process.reservationId) {
      await tx.appointmentHold.deleteMany({
        where: { id: process.reservationId },
      });
    }
  });
}

async function notifyCompletion(processId: string) {
  await db.$transaction(async (tx) => {
    const process = await tx.appointmentRescheduleProcess.findUnique({
      where: { id: processId },
      select: {
        id: true,
        completionNotifiedAt: true,
        previousDate: true,
        previousTime: true,
        newDate: true,
        newTime: true,
        appointment: {
          select: {
            id: true,
            price: true,
            patientId: true,
            professionalId: true,
            patient: { select: { name: true, email: true } },
            professional: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!process || process.completionNotifiedAt) return;

    await upsertNotification({
      userId: process.appointment.patientId,
      type: "INFO",
      eventType: "HEALTH_APPOINTMENT_RESCHEDULED",
      title: "Consulta reagendada",
      message: `Novo horario: ${process.newDate.toLocaleDateString("pt-BR")} as ${process.newTime}.`,
      link: "/agendar-consulta/historico",
      entityType: "APPOINTMENT",
      entityId: process.appointment.id,
    }, tx);
    await upsertNotification({
      userId: process.appointment.professionalId,
      type: "SUCCESS",
      eventType: "HEALTH_APPOINTMENT_RESCHEDULED",
      title: "Reagendamento concluido",
      message: "Google Calendar e agenda MWC foram sincronizados.",
      link: "/agendar-consulta/dashboard-profissional",
      entityType: "APPOINTMENT",
      entityId: process.appointment.id,
    }, tx);
    await enqueueRescheduleEmail(tx, {
      appointmentId: process.appointment.id,
      rescheduleProcessId: process.id,
      patient: {
        id: process.appointment.patientId,
        ...process.appointment.patient,
      },
      professional: {
        id: process.appointment.professionalId,
        ...process.appointment.professional,
      },
      previousDate: process.previousDate,
      previousTime: process.previousTime,
      date: process.newDate,
      time: process.newTime,
      price: process.appointment.price,
    });
    await tx.appointmentRescheduleProcess.updateMany({
      where: { id: processId, completionNotifiedAt: null },
      data: { completionNotifiedAt: new Date() },
    });
  });
}

async function notifyReconciliation(processId: string) {
  await db.$transaction(async (tx) => {
    const process = await tx.appointmentRescheduleProcess.findUnique({
      where: { id: processId },
      select: {
        id: true,
        appointmentId: true,
        calendarStatus: true,
        databaseStatus: true,
        reconciliationAlertedAt: true,
      },
    });
    if (!process || process.reconciliationAlertedAt) return;

    const admins = await tx.user.findMany({
      where: { userType: "ADMIN", isActive: true },
      select: { id: true, email: true, name: true, displayName: true },
    });
    const message = `O reagendamento exige reconciliacao manual. Calendar: ${process.calendarStatus}; banco: ${process.databaseStatus}.`;

    for (const admin of admins) {
      await upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType: "HEALTH_RESCHEDULE_RECONCILIATION_REQUIRED",
        title: "Reagendamento exige reconciliacao",
        message,
        link: "/dashboard/admin/reconciliacoes",
        entityType: "APPOINTMENT_RESCHEDULE",
        entityId: process.id,
      }, tx);
      await enqueueHealthOperationalAttentionEmail(tx, {
        eventType: "HEALTH_RESCHEDULE_RECONCILIATION_REQUIRED",
        entityType: "APPOINTMENT_RESCHEDULE",
        entityId: process.id,
        appointmentId: process.appointmentId,
        title: "Reagendamento exige reconciliacao",
        summary: message,
        recipient: admin,
      });
    }

    await tx.appointmentRescheduleProcess.updateMany({
      where: { id: processId, reconciliationAlertedAt: null },
      data: { reconciliationAlertedAt: new Date() },
    });
  });
}

export async function processAppointmentReschedule(
  processId: string,
): Promise<RescheduleRecoveryResult> {
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const claim = await db.appointmentRescheduleProcess.updateMany({
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
    const current = await db.appointmentRescheduleProcess.findUnique({
      where: { id: processId },
      select: {
        appointmentId: true,
        status: true,
        completionNotifiedAt: true,
      },
    });

    if (current?.status === "COMPLETED" && !current.completionNotifiedAt) {
      await notifyCompletion(processId);
    }

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

  const process = await db.appointmentRescheduleProcess.findUniqueOrThrow({
    where: { id: processId },
    select: { appointmentId: true, attemptCount: true, maxAttempts: true },
  });
  const errors: string[] = [];

  try {
    await processCalendarStep(processId);
  } catch (error) {
    const message = errorMessage(error);
    errors.push(`Google Calendar: ${message}`);
    await db.appointmentRescheduleProcess.update({
      where: { id: processId },
      data: { calendarLastError: message },
    });
  }

  try {
    await processDatabaseStep(processId);
  } catch (error) {
    const message = errorMessage(error);
    errors.push(`Banco: ${message}`);
    await db.appointmentRescheduleProcess.update({
      where: { id: processId },
      data: { databaseLastError: message },
    });
  }

  const current = await db.appointmentRescheduleProcess.findUniqueOrThrow({
    where: { id: processId },
    select: { status: true },
  });

  if (current.status === "COMPLETED") {
    await notifyCompletion(processId);
    return { appointmentId: process.appointmentId, status: "COMPLETED" };
  }

  const lastError = errors.join(" | ") || "Existem etapas pendentes.";
  if (process.attemptCount >= process.maxAttempts) {
    await db.appointmentRescheduleProcess.update({
      where: { id: processId },
      data: {
        status: "RECONCILIATION_REQUIRED",
        reconciliationRequiredAt: new Date(),
        processingStartedAt: null,
        lastError,
      },
    });
    await notifyReconciliation(processId);
    return {
      appointmentId: process.appointmentId,
      status: "RECONCILIATION_REQUIRED",
      error: lastError,
    };
  }

  const backoff =
    BACKOFF_MINUTES[Math.min(process.attemptCount - 1, BACKOFF_MINUTES.length - 1)];
  await db.appointmentRescheduleProcess.update({
    where: { id: processId },
    data: {
      status: "RETRY_SCHEDULED",
      nextAttemptAt: new Date(Date.now() + backoff * 60 * 1000),
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

export async function recoverPendingAppointmentReschedules(limit = 25) {
  const staleBefore = new Date(
    Date.now() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const processes = await db.appointmentRescheduleProcess.findMany({
    where: {
      OR: [
        {
          status: { in: ["PENDING", "RETRY_SCHEDULED"] },
          nextAttemptAt: { lte: new Date() },
        },
        { status: "PROCESSING", processingStartedAt: { lte: staleBefore } },
        { status: "COMPLETED", completionNotifiedAt: null },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: { id: true },
  });

  const results: RescheduleRecoveryResult[] = [];
  for (const process of processes) {
    results.push(await processAppointmentReschedule(process.id));
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

export async function retryAppointmentRescheduleReconciliation(
  processId: string,
) {
  const reopened = await db.appointmentRescheduleProcess.updateMany({
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

  return processAppointmentReschedule(processId);
}
