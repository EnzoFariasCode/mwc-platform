import { Resend } from "resend";

type HealthEmailRecipient = {
  email: string | null;
  name?: string | null;
};

type HealthAppointmentEmailPayload = {
  patient: HealthEmailRecipient;
  professional: HealthEmailRecipient;
  date: Date;
  time: string;
  price?: unknown;
  meetLink?: string | null;
  reason?: string;
  refundId?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br";
const resend = resendApiKey && resendFrom ? new Resend(resendApiKey) : null;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMoney(value?: unknown) {
  if (value === null || value === undefined) return "Nao informado";
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "Nao informado";

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function sendHealthEmail({
  to,
  subject,
  text,
}: {
  to: string | null;
  subject: string;
  text: string;
}) {
  if (!to) return;

  if (!resend || !resendFrom) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[HEALTH_EMAIL] ${subject} -> ${to}\n${text}`);
    }
    return;
  }

  try {
    await resend.emails.send({
      from: resendFrom,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("[HEALTH_EMAIL_ERROR]", error);
  }
}

function buildBaseLines(payload: HealthAppointmentEmailPayload) {
  return [
    `Paciente: ${payload.patient.name || "Paciente"}`,
    `Profissional: ${payload.professional.name || "Profissional"}`,
    `Data: ${formatDate(payload.date)}`,
    `Horario: ${payload.time}`,
    `Valor: ${formatMoney(payload.price)}`,
  ];
}

export async function sendPaymentConfirmedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Pagamento confirmado e consulta agendada",
    text: [
      "Seu pagamento foi confirmado e sua consulta esta agendada.",
      "",
      ...buildBaseLines(payload),
      payload.meetLink ? `Link da consulta: ${payload.meetLink}` : null,
      "",
      "O valor ficara retido em escrow e sera liberado ao profissional apos a conclusao da consulta.",
      `Acompanhe em: ${appUrl}/agendar-consulta/historico`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  await sendHealthEmail({
    to: payload.professional.email,
    subject: "MWC Online - Nova consulta confirmada",
    text: [
      "Uma nova consulta foi confirmada na sua agenda.",
      "",
      ...buildBaseLines(payload),
      payload.meetLink ? `Link da consulta: ${payload.meetLink}` : null,
      "",
      "O valor esta em Lancamentos Futuros e sera liberado apos a conclusao.",
      `Acompanhe em: ${appUrl}/agendar-consulta/dashboard-profissional`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendCancellationEmail(
  payload: HealthAppointmentEmailPayload & {
    canceledBy: "patient" | "professional";
    refundRequested: boolean;
    lateCancelFeeApplied?: boolean;
  },
) {
  const actor =
    payload.canceledBy === "patient" ? "paciente" : "profissional";
  const refundText = payload.refundRequested
    ? `Reembolso solicitado ao Stripe${payload.refundId ? `: ${payload.refundId}` : ""}. O prazo usual e de 5 a 10 dias uteis.`
    : payload.lateCancelFeeApplied
      ? "Cancelamento com menos de 24h: sem reembolso, valor liberado ao profissional."
      : "Sem reembolso solicitado.";

  const text = [
    `A consulta foi cancelada pelo ${actor}.`,
    "",
    ...buildBaseLines(payload),
    payload.reason ? `Motivo: ${payload.reason}` : null,
    refundText,
  ]
    .filter(Boolean)
    .join("\n");

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta cancelada",
    text,
  });

  await sendHealthEmail({
    to: payload.professional.email,
    subject: "MWC Online - Consulta cancelada",
    text,
  });
}

export async function sendRefundProcessedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Reembolso processado",
    text: [
      "Seu reembolso foi processado.",
      "",
      ...buildBaseLines(payload),
      payload.reason ? `Motivo: ${payload.reason}` : null,
      payload.refundId ? `Referencia Stripe: ${payload.refundId}` : null,
      "O valor deve retornar ao metodo de pagamento original em ate 5 a 10 dias uteis.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendAppointmentCompletedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta concluida",
    text: [
      "Sua consulta foi marcada como concluida.",
      "",
      ...buildBaseLines(payload),
      "Obrigado por utilizar a MWC Online.",
    ].join("\n"),
  });
}

export async function sendRescheduleEmail(
  payload: HealthAppointmentEmailPayload & { previousDate?: Date; previousTime?: string },
) {
  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta reagendada",
    text: [
      "Sua consulta foi reagendada pelo profissional.",
      "",
      payload.previousDate && payload.previousTime
        ? `Horario anterior: ${formatDate(payload.previousDate)} as ${payload.previousTime}`
        : null,
      ...buildBaseLines(payload),
      payload.meetLink ? `Link da consulta: ${payload.meetLink}` : null,
      "O pagamento original permanece valido. Nenhuma nova cobranca sera feita.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
