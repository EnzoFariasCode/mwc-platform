import "server-only";

import type { Prisma } from "@prisma/client";
import type { EmailOutboxDatabaseClient } from "@/modules/email/services/email-outbox-service";
import { enqueueTransactionalEmail } from "@/modules/email/services/email-outbox-service";
import type { HealthOnlineEmailTemplateKey } from "@/modules/email/templates/health-online-emails";

type HealthEmailRecipient = {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
};

type HealthAppointmentEmailPayload = {
  appointmentId: string;
  patient: HealthEmailRecipient;
  professional: HealthEmailRecipient;
  date: Date;
  time: string;
  price?: unknown;
  reason?: string;
  refundId?: string;
};

type HealthEmailContent = {
  title: string;
  preview: string;
  lines: string[];
  details?: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionPath: string;
};

function recipientName(recipient: HealthEmailRecipient) {
  return recipient.displayName || recipient.name || null;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMoney(value?: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "Nao informado";

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function appointmentDetails(payload: HealthAppointmentEmailPayload) {
  return [
    { label: "Paciente", value: recipientName(payload.patient) || "Paciente" },
    {
      label: "Profissional",
      value: recipientName(payload.professional) || "Profissional",
    },
    { label: "Data", value: formatDate(payload.date) },
    { label: "Horario", value: payload.time },
    { label: "Valor", value: formatMoney(payload.price) },
  ];
}

function enqueueHealthEmail(
  client: EmailOutboxDatabaseClient,
  input: {
    idempotencyKey: string;
    eventType: string;
    templateKey: HealthOnlineEmailTemplateKey;
    recipient: HealthEmailRecipient;
    entityType: string;
    entityId: string;
    content: HealthEmailContent;
    priority?: number;
  },
) {
  return enqueueTransactionalEmail(client, {
    idempotencyKey: input.idempotencyKey,
    eventType: input.eventType,
    templateKey: input.templateKey,
    templateVersion: 1,
    recipientUserId: input.recipient.id,
    recipientEmail: input.recipient.email,
    recipientName: recipientName(input.recipient),
    entityType: input.entityType,
    entityId: input.entityId,
    priority: input.priority,
    payload: {
      recipientName: recipientName(input.recipient),
      title: input.content.title,
      preview: input.content.preview,
      lines: input.content.lines,
      details: input.content.details ?? [],
      actionLabel: input.content.actionLabel,
      actionPath: input.content.actionPath,
    },
  });
}

export async function enqueuePaymentConfirmedEmails(
  client: EmailOutboxDatabaseClient,
  payload: HealthAppointmentEmailPayload,
) {
  const details = appointmentDetails(payload);

  await enqueueHealthEmail(client, {
    idempotencyKey: `HEALTH_APPOINTMENT_CONFIRMED:${payload.appointmentId}:${payload.patient.id}`,
    eventType: "HEALTH_APPOINTMENT_CONFIRMED",
    templateKey: "health.appointment.confirmed",
    recipient: payload.patient,
    entityType: "APPOINTMENT",
    entityId: payload.appointmentId,
    content: {
      title: "Pagamento confirmado e consulta agendada",
      preview: "Seu pagamento foi confirmado e sua consulta esta agendada.",
      lines: [
        "Seu pagamento foi confirmado e sua consulta esta agendada.",
        "O valor ficara protegido e sera liberado ao profissional apos a conclusao da consulta.",
        "O acesso a sala sera exibido na plataforma 10 minutos antes do horario agendado.",
      ],
      details,
      actionLabel: "Acompanhar consulta",
      actionPath: "/agendar-consulta/historico",
    },
  });

  await enqueueHealthEmail(client, {
    idempotencyKey: `HEALTH_APPOINTMENT_CONFIRMED:${payload.appointmentId}:${payload.professional.id}`,
    eventType: "HEALTH_APPOINTMENT_CONFIRMED",
    templateKey: "health.appointment.confirmed",
    recipient: payload.professional,
    entityType: "APPOINTMENT",
    entityId: payload.appointmentId,
    content: {
      title: "Nova consulta confirmada",
      preview: "Uma nova consulta foi confirmada na sua agenda.",
      lines: [
        "Uma nova consulta foi confirmada na sua agenda.",
        "O valor esta em Lancamentos Futuros e sera liberado apos a conclusao.",
        "O acesso a sala sera exibido na plataforma 10 minutos antes do horario agendado.",
      ],
      details,
      actionLabel: "Abrir agenda",
      actionPath: "/agendar-consulta/dashboard-profissional",
    },
  });
}

export async function ensureAppointmentPaymentConfirmedEmails(
  client: EmailOutboxDatabaseClient &
    Pick<Prisma.TransactionClient, "appointment">,
  appointmentId: string,
) {
  const appointment = await client.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      paymentConfirmedAt: true,
      date: true,
      time: true,
      price: true,
      patient: {
        select: { id: true, email: true, name: true, displayName: true },
      },
      professional: {
        select: { id: true, email: true, name: true, displayName: true },
      },
    },
  });

  if (
    !appointment?.paymentConfirmedAt ||
    ![
      "MEETING_PENDING",
      "MEETING_REQUIRES_ATTENTION",
      "CONFIRMED",
    ].includes(appointment.status)
  ) {
    throw new Error(
      "Nao foi possivel registrar os e-mails: pagamento da consulta nao confirmado.",
    );
  }

  await enqueuePaymentConfirmedEmails(client, {
    appointmentId: appointment.id,
    patient: appointment.patient,
    professional: appointment.professional,
    date: appointment.date,
    time: appointment.time,
    price: appointment.price,
  });
}

export async function enqueueCancellationEmails(
  client: EmailOutboxDatabaseClient,
  payload: HealthAppointmentEmailPayload & {
    cancellationEventId: string;
    canceledBy: "patient" | "professional";
    refundRequested: boolean;
    lateCancelFeeApplied?: boolean;
  },
) {
  const actor = payload.canceledBy === "patient" ? "paciente" : "profissional";
  const refundText = payload.refundRequested
    ? "O reembolso foi solicitado a Stripe e seguira o prazo do metodo de pagamento original."
    : payload.lateCancelFeeApplied
      ? "Como o cancelamento ocorreu com menos de 24 horas, nao ha reembolso e o valor foi liberado ao profissional."
      : "Nao houve solicitacao de reembolso.";
  const lines = [
    `A consulta foi cancelada pelo ${actor}.`,
    ...(payload.reason ? [`Motivo: ${payload.reason}`] : []),
    refundText,
  ];

  for (const recipient of [payload.patient, payload.professional]) {
    await enqueueHealthEmail(client, {
      idempotencyKey: `HEALTH_APPOINTMENT_CANCELED:${payload.cancellationEventId}:${recipient.id}`,
      eventType: "HEALTH_APPOINTMENT_CANCELED",
      templateKey: "health.appointment.canceled",
      recipient,
      entityType: "APPOINTMENT",
      entityId: payload.appointmentId,
      content: {
        title: "Consulta cancelada",
        preview: `A consulta foi cancelada pelo ${actor}.`,
        lines,
        details: appointmentDetails(payload),
        actionLabel: "Ver consultas",
        actionPath:
          recipient.id === payload.patient.id
            ? "/agendar-consulta/historico"
            : "/agendar-consulta/dashboard-profissional",
      },
    });
  }
}

export async function enqueueRefundProcessedEmail(
  client: EmailOutboxDatabaseClient,
  payload: HealthAppointmentEmailPayload,
) {
  const idempotencyKey = `HEALTH_REFUND_PROCESSED:${payload.appointmentId}:${payload.patient.id}`;
  const existing = await client.emailOutbox.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return { email: existing, created: false } as const;

  return enqueueHealthEmail(client, {
    idempotencyKey,
    eventType: "HEALTH_REFUND_PROCESSED",
    templateKey: "health.refund.processed",
    recipient: payload.patient,
    entityType: "APPOINTMENT",
    entityId: payload.appointmentId,
    content: {
      title: "Reembolso processado",
      preview: "Seu reembolso foi processado.",
      lines: [
        "Seu reembolso foi processado pela Stripe.",
        ...(payload.reason ? [`Motivo: ${payload.reason}`] : []),
        "O valor deve retornar ao metodo de pagamento original conforme o prazo da instituicao financeira.",
      ],
      details: appointmentDetails(payload),
      actionLabel: "Ver historico",
      actionPath: "/agendar-consulta/historico",
    },
  });
}

export function enqueueAppointmentCompletedEmail(
  client: EmailOutboxDatabaseClient,
  payload: HealthAppointmentEmailPayload,
) {
  return enqueueHealthEmail(client, {
    idempotencyKey: `HEALTH_APPOINTMENT_COMPLETED:${payload.appointmentId}:${payload.patient.id}`,
    eventType: "HEALTH_APPOINTMENT_COMPLETED",
    templateKey: "health.appointment.completed",
    recipient: payload.patient,
    entityType: "APPOINTMENT",
    entityId: payload.appointmentId,
    content: {
      title: "Consulta concluida",
      preview: "Sua consulta foi marcada como concluida.",
      lines: [
        "Sua consulta foi marcada como concluida.",
        "Obrigado por utilizar a MWC Online.",
      ],
      details: appointmentDetails(payload),
      actionLabel: "Ver historico",
      actionPath: "/agendar-consulta/historico",
    },
  });
}

export function enqueueRescheduleEmail(
  client: EmailOutboxDatabaseClient,
  payload: HealthAppointmentEmailPayload & {
    rescheduleProcessId: string;
    previousDate: Date;
    previousTime: string;
  },
) {
  return enqueueHealthEmail(client, {
    idempotencyKey: `HEALTH_APPOINTMENT_RESCHEDULED:${payload.rescheduleProcessId}:${payload.patient.id}`,
    eventType: "HEALTH_APPOINTMENT_RESCHEDULED",
    templateKey: "health.appointment.rescheduled",
    recipient: payload.patient,
    entityType: "APPOINTMENT_RESCHEDULE",
    entityId: payload.rescheduleProcessId,
    content: {
      title: "Consulta reagendada",
      preview: "Sua consulta foi reagendada pelo profissional.",
      lines: [
        "Sua consulta foi reagendada pelo profissional.",
        `Horario anterior: ${formatDate(payload.previousDate)} as ${payload.previousTime}.`,
        "O pagamento original permanece valido. Nenhuma nova cobranca sera feita.",
      ],
      details: appointmentDetails(payload),
      actionLabel: "Ver novo horario",
      actionPath: "/agendar-consulta/historico",
    },
  });
}

export function enqueueHealthOperationalAttentionEmail(
  client: EmailOutboxDatabaseClient,
  input: {
    eventType: string;
    entityType: string;
    entityId: string;
    appointmentId: string;
    title: string;
    summary: string;
    recipient: HealthEmailRecipient;
    actionPath?: string;
  },
) {
  return enqueueHealthEmail(client, {
    idempotencyKey: `${input.eventType}:${input.entityType}:${input.entityId}:${input.recipient.id}`,
    eventType: input.eventType,
    templateKey: "health.operational.attention",
    recipient: input.recipient,
    entityType: input.entityType,
    entityId: input.entityId,
    priority: 20,
    content: {
      title: input.title,
      preview: input.summary,
      lines: [
        input.summary,
        "O pagamento e os dados da consulta permanecem protegidos. Consulte o painel administrativo para os detalhes tecnicos e as acoes disponiveis.",
      ],
      details: [{ label: "Consulta", value: input.appointmentId }],
      actionLabel: "Abrir reconciliacoes",
      actionPath: input.actionPath || "/dashboard/admin/reconciliacoes",
    },
  });
}
