import "server-only";

import { createHash } from "crypto";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createGoogleMeetEvent } from "@/modules/health/services/google-meet-service";
import {
  sendPaymentConfirmedEmail,
  sendRefundProcessedEmail,
} from "@/modules/health/services/transactional-email-service";
import { sendAdminNotification } from "@/modules/admin/services/admin-notification-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

const MAX_MEET_ATTEMPTS = 5;
const PROCESSING_LOCK_MINUTES = 10;

export type MeetingRecoveryResult = {
  status: "CONFIRMED" | "PENDING" | "FAILED";
  appointmentId: string;
  error?: string;
};

function appointmentStart(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
}

function createMeetRequestId(stripeSessionId: string) {
  return `mwc-${createHash("sha256")
    .update(stripeSessionId)
    .digest("hex")
    .slice(0, 24)}`;
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
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType,
        title,
        message,
        link: "/dashboard/admin",
        entityType: "APPOINTMENT",
        entityId: appointmentId,
      }),
    ),
  );

  await sendAdminNotification({
    subject: `MWC Online - ${title}`,
    lines: [message, `Agendamento: ${appointmentId}`],
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin`,
  });
}

async function finalizeMeetingFailure(appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      stripeSessionId: true,
      professionalId: true,
      patientId: true,
      date: true,
      time: true,
      price: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
    },
  });

  if (!appointment) {
    return { status: "FAILED", appointmentId, error: "Agendamento nao encontrado." } as const;
  }

  if (appointment.status === "MEETING_FAILED") {
    return { status: "FAILED", appointmentId } as const;
  }

  if (!appointment.stripeSessionId) {
    const error = "Agendamento pago sem sessao Stripe para reembolso.";
    await notifyAdmins({
      appointmentId,
      title: "Reembolso automatico bloqueado",
      message: error,
      eventType: "HEALTH_MEETING_REFUND_BLOCKED",
    });
    return { status: "PENDING", appointmentId, error } as const;
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      appointment.stripeSessionId,
    );
    const paymentIntent =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;

    if (!paymentIntent) {
      throw new Error("Payment Intent nao encontrado na sessao Stripe.");
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntent,
        reason: "requested_by_customer",
        metadata: {
          type: "HEALTH_MEETING_FAILURE",
          appointmentId: appointment.id,
        },
      },
      { idempotencyKey: `health-meeting-failure-${appointment.id}` },
    );

    await db.$transaction(async (tx) => {
      const pendingCredit = await tx.transaction.findFirst({
        where: {
          appointmentId: appointment.id,
          userId: appointment.professionalId,
          type: "CREDIT",
          status: "PENDING",
        },
        select: { id: true, amount: true },
      });

      const updated = await tx.appointment.updateMany({
        where: { id: appointment.id, status: "MEETING_PENDING" },
        data: {
          status: "MEETING_FAILED",
          meetingFailedAt: new Date(),
          meetingRefundId: refund.id,
          meetProcessingStartedAt: null,
          meetLastError: "Google Meet indisponivel apos o limite de tentativas.",
        },
      });

      if (updated.count !== 1) return;

      if (pendingCredit) {
        await tx.transaction.update({
          where: { id: pendingCredit.id },
          data: {
            status: "CANCELED",
            description: `Atendimento cancelado por falha na reuniao - Reembolso Stripe: ${refund.id}`,
          },
        });
        await tx.user.update({
          where: { id: appointment.professionalId },
          data: { pendingBalance: { decrement: pendingCredit.amount } },
        });
      }
    });

    await Promise.all([
      upsertNotification({
        userId: appointment.patientId,
        type: "WARNING",
        eventType: "HEALTH_MEETING_FAILED_REFUNDED",
        title: "Consulta reembolsada",
        message:
          "Nao foi possivel preparar a sala online. O reembolso integral foi solicitado automaticamente.",
        link: "/agendar-consulta/historico",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: { refundId: refund.id },
      }),
      upsertNotification({
        userId: appointment.professionalId,
        type: "WARNING",
        eventType: "HEALTH_MEETING_FAILED_REFUNDED",
        title: "Consulta cancelada",
        message:
          "A consulta foi cancelada porque a sala online nao pode ser criada. O paciente foi reembolsado.",
        link: "/agendar-consulta/dashboard-profissional",
        entityType: "APPOINTMENT",
        entityId: appointment.id,
        metadata: { refundId: refund.id },
      }),
      notifyAdmins({
        appointmentId: appointment.id,
        title: "Falha definitiva no Google Meet",
        message: `Reembolso Stripe ${refund.id} solicitado automaticamente.`,
        eventType: "HEALTH_MEETING_FAILED_REFUNDED",
      }),
      sendRefundProcessedEmail({
        patient: appointment.patient,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
        reason: "Nao foi possivel criar a sala online apos varias tentativas.",
        refundId: refund.id,
      }),
    ]);

    return { status: "FAILED", appointmentId: appointment.id } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no reembolso.";
    await db.appointment.updateMany({
      where: { id: appointment.id, status: "MEETING_PENDING" },
      data: {
        meetProcessingStartedAt: null,
        meetLastError: `Falha ao reembolsar: ${message}`,
      },
    });
    await notifyAdmins({
      appointmentId: appointment.id,
      title: "Reembolso automatico falhou",
      message,
      eventType: "HEALTH_MEETING_REFUND_FAILED",
    });
    return { status: "PENDING", appointmentId: appointment.id, error: message } as const;
  }
}

export async function processAppointmentMeeting(
  appointmentId: string,
): Promise<MeetingRecoveryResult> {
  const current = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      meetRetryCount: true,
      meetLink: true,
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
  if (current.meetRetryCount >= MAX_MEET_ATTEMPTS) {
    return finalizeMeetingFailure(appointmentId);
  }
  if (current.status !== "MEETING_PENDING") {
    return { status: "FAILED", appointmentId, error: "Status nao permite criar reuniao." };
  }

  const claimedAt = new Date();
  const staleBefore = new Date(
    claimedAt.getTime() - PROCESSING_LOCK_MINUTES * 60 * 1000,
  );
  const claim = await db.appointment.updateMany({
    where: {
      id: appointmentId,
      status: "MEETING_PENDING",
      meetRetryCount: { lt: MAX_MEET_ATTEMPTS },
      OR: [
        { meetProcessingStartedAt: null },
        { meetProcessingStartedAt: { lte: staleBefore } },
      ],
    },
    data: {
      meetRetryCount: { increment: 1 },
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
      date: true,
      time: true,
      price: true,
      patientId: true,
      professionalId: true,
      patient: { select: { name: true, email: true } },
      professional: {
        select: { name: true, email: true, sessionDuration: true },
      },
    },
  });

  if (!appointment?.stripeSessionId) {
    await db.appointment.updateMany({
      where: { id: appointmentId, status: "MEETING_PENDING" },
      data: {
        meetProcessingStartedAt: null,
        meetLastError: "Sessao Stripe ausente.",
      },
    });
    return { status: "PENDING", appointmentId, error: "Sessao Stripe ausente." };
  }

  const startTime = appointmentStart(appointment.date, appointment.time);
  const durationMinutes = appointment.professional.sessionDuration || 50;

  try {
    if (!appointment.patient.email || !appointment.professional.email) {
      throw new Error(
        "Paciente ou profissional sem email para receber a sala online.",
      );
    }

    const meetEvent = await createGoogleMeetEvent({
      summary: `MWC Online - Consulta com ${appointment.professional.name ?? "profissional"}`,
      description: `Consulta MWC Online confirmada pelo pagamento Stripe ${appointment.stripeSessionId}.`,
      startTime,
      endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
      attendees: [
        appointment.patient.email,
        appointment.professional.email,
      ],
      requestId: createMeetRequestId(appointment.stripeSessionId),
    });

    if (!meetEvent) {
      throw new Error("Google Calendar nao retornou uma sala valida.");
    }

    const confirmed = await db.appointment.updateMany({
      where: {
        id: appointment.id,
        status: "MEETING_PENDING",
        meetProcessingStartedAt: claimedAt,
      },
      data: {
        status: "CONFIRMED",
        meetLink: meetEvent.meetLink,
        googleEventId: meetEvent.googleEventId,
        meetProcessingStartedAt: null,
        meetLastError: null,
      },
    });

    if (confirmed.count === 1) {
      await Promise.all([
        sendPaymentConfirmedEmail({
          patient: appointment.patient,
          professional: appointment.professional,
          date: appointment.date,
          time: appointment.time,
          price: appointment.price,
          meetLink: meetEvent.meetLink,
        }),
        upsertNotification({
          userId: appointment.patientId,
          type: "SUCCESS",
          eventType: "HEALTH_MEETING_READY",
          title: "Consulta confirmada",
          message: "A sala online foi criada e ja esta disponivel no seu historico.",
          link: "/agendar-consulta/historico",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
        }),
        upsertNotification({
          userId: appointment.professionalId,
          type: "SUCCESS",
          eventType: "HEALTH_MEETING_READY",
          title: "Nova consulta confirmada",
          message: "A sala online foi criada e a consulta esta na sua agenda.",
          link: "/agendar-consulta/dashboard-profissional",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
        }),
      ]);
    }

    return { status: "CONFIRMED", appointmentId: appointment.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no Google Meet.";
    await db.appointment.updateMany({
      where: {
        id: appointment.id,
        status: "MEETING_PENDING",
        meetProcessingStartedAt: claimedAt,
      },
      data: {
        meetProcessingStartedAt: null,
        meetLastError: message,
      },
    });

    if (appointment.meetRetryCount >= MAX_MEET_ATTEMPTS) {
      return finalizeMeetingFailure(appointment.id);
    }

    return { status: "PENDING", appointmentId: appointment.id, error: message };
  }
}

export async function recoverPendingAppointmentMeetings(limit = 25) {
  const retryBefore = new Date(Date.now() - 2 * 60 * 1000);
  const appointments = await db.appointment.findMany({
    where: {
      status: "MEETING_PENDING",
      OR: [
        { meetLastAttemptAt: null },
        { meetLastAttemptAt: { lte: retryBefore } },
        { meetRetryCount: { gte: MAX_MEET_ATTEMPTS } },
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

  return {
    processed: results.length,
    confirmed: results.filter((result) => result.status === "CONFIRMED").length,
    pending: results.filter((result) => result.status === "PENDING").length,
    failed: results.filter((result) => result.status === "FAILED").length,
  };
}
