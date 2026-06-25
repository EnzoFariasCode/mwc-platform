import { sendEmail } from "@/modules/email/email-client";
import { healthEmailTemplate } from "@/modules/email/templates/health-emails";

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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br";

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
  html,
}: {
  to: string | null;
  subject: string;
  text: string;
  html: string;
}) {
  await sendEmail({
    to,
    subject,
    text,
    html,
    logPrefix: "HEALTH_EMAIL",
  });
}

function buildBaseDetails(payload: HealthAppointmentEmailPayload) {
  return [
    ["Paciente", payload.patient.name || "Paciente"],
    ["Profissional", payload.professional.name || "Profissional"],
    ["Data", formatDate(payload.date)],
    ["Horario", payload.time],
    ["Valor", formatMoney(payload.price)],
    ["Link da consulta", payload.meetLink],
  ] satisfies Array<[string, string | null | undefined]>;
}

export async function sendPaymentConfirmedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  const patientEmail = healthEmailTemplate({
    title: "Pagamento confirmado",
    preview: "Seu pagamento foi confirmado e sua consulta esta agendada.",
    lines: [
      "Seu pagamento foi confirmado e sua consulta esta agendada.",
      "O valor ficara retido em escrow e sera liberado ao profissional apos a conclusao da consulta.",
    ],
    details: buildBaseDetails(payload),
    actionLabel: "Acompanhar consulta",
    actionUrl: `${appUrl}/agendar-consulta/historico`,
  });

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Pagamento confirmado e consulta agendada",
    ...patientEmail,
  });

  const professionalEmail = healthEmailTemplate({
    title: "Nova consulta confirmada",
    preview: "Uma nova consulta foi confirmada na sua agenda.",
    lines: [
      "Uma nova consulta foi confirmada na sua agenda.",
      "O valor esta em Lancamentos Futuros e sera liberado apos a conclusao.",
    ],
    details: buildBaseDetails(payload),
    actionLabel: "Abrir agenda",
    actionUrl: `${appUrl}/agendar-consulta/dashboard-profissional`,
  });

  await sendHealthEmail({
    to: payload.professional.email,
    subject: "MWC Online - Nova consulta confirmada",
    ...professionalEmail,
  });
}

export async function sendCancellationEmail(
  payload: HealthAppointmentEmailPayload & {
    canceledBy: "patient" | "professional";
    refundRequested: boolean;
    lateCancelFeeApplied?: boolean;
  },
) {
  const actor = payload.canceledBy === "patient" ? "paciente" : "profissional";
  const refundText = payload.refundRequested
    ? `Reembolso solicitado ao Stripe${payload.refundId ? `: ${payload.refundId}` : ""}. O prazo usual e de 5 a 10 dias uteis.`
    : payload.lateCancelFeeApplied
      ? "Cancelamento com menos de 24h: sem reembolso, valor liberado ao profissional."
      : "Sem reembolso solicitado.";

  const email = healthEmailTemplate({
    title: "Consulta cancelada",
    preview: `A consulta foi cancelada pelo ${actor}.`,
    lines: [
      `A consulta foi cancelada pelo ${actor}.`,
      payload.reason ? `Motivo: ${payload.reason}` : null,
      refundText,
    ],
    details: buildBaseDetails(payload),
  });

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta cancelada",
    ...email,
  });

  await sendHealthEmail({
    to: payload.professional.email,
    subject: "MWC Online - Consulta cancelada",
    ...email,
  });
}

export async function sendRefundProcessedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  const email = healthEmailTemplate({
    title: "Reembolso processado",
    preview: "Seu reembolso foi processado.",
    lines: [
      "Seu reembolso foi processado.",
      payload.reason ? `Motivo: ${payload.reason}` : null,
      payload.refundId ? `Referencia Stripe: ${payload.refundId}` : null,
      "O valor deve retornar ao metodo de pagamento original em ate 5 a 10 dias uteis.",
    ],
    details: buildBaseDetails(payload),
  });

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Reembolso processado",
    ...email,
  });
}

export async function sendAppointmentCompletedEmail(
  payload: HealthAppointmentEmailPayload,
) {
  const email = healthEmailTemplate({
    title: "Consulta concluida",
    preview: "Sua consulta foi marcada como concluida.",
    lines: [
      "Sua consulta foi marcada como concluida.",
      "Obrigado por utilizar a MWC Online.",
    ],
    details: buildBaseDetails(payload),
  });

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta concluida",
    ...email,
  });
}

export async function sendRescheduleEmail(
  payload: HealthAppointmentEmailPayload & {
    previousDate?: Date;
    previousTime?: string;
  },
) {
  const email = healthEmailTemplate({
    title: "Consulta reagendada",
    preview: "Sua consulta foi reagendada pelo profissional.",
    lines: [
      "Sua consulta foi reagendada pelo profissional.",
      payload.previousDate && payload.previousTime
        ? `Horario anterior: ${formatDate(payload.previousDate)} as ${payload.previousTime}`
        : null,
      "O pagamento original permanece valido. Nenhuma nova cobranca sera feita.",
    ],
    details: buildBaseDetails(payload),
  });

  await sendHealthEmail({
    to: payload.patient.email,
    subject: "MWC Online - Consulta reagendada",
    ...email,
  });
}
