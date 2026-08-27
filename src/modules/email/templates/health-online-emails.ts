import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { healthEmailTemplate } from "./health-emails";

const detailSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(1_000),
  })
  .strict();

const healthOnlinePayloadSchema = z
  .object({
    recipientName: z.string().trim().min(1).max(160).nullable(),
    title: z.string().trim().min(1).max(120),
    preview: z.string().trim().min(1).max(180),
    lines: z.array(z.string().trim().min(1).max(1_000)).min(1).max(8),
    details: z.array(detailSchema).max(10).default([]),
    actionLabel: z.string().trim().min(1).max(80),
    actionPath: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .refine(
        (value) =>
          value === "/dashboard" ||
          value.startsWith("/dashboard/") ||
          value === "/agendar-consulta" ||
          value.startsWith("/agendar-consulta/"),
        "O destino deve pertencer a plataforma.",
      ),
  })
  .strict();

export const HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS = [
  "health.appointment.confirmed",
  "health.appointment.rescheduled",
  "health.appointment.canceled",
  "health.refund.processed",
  "health.appointment.completed",
  "health.operational.attention",
] as const;

export type HealthOnlineEmailTemplateKey =
  (typeof HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS)[number];

function appOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.maximusworldclick.com.br";

  try {
    return new URL(configured).origin;
  } catch {
    return "https://www.maximusworldclick.com.br";
  }
}

export function renderHealthOnlineTransactionalEmail(payload: Prisma.JsonValue) {
  const data = healthOnlinePayloadSchema.parse(payload);
  const actionUrl = new URL(data.actionPath, appOrigin()).toString();
  const greeting = data.recipientName
    ? `Ola, ${data.recipientName}.`
    : "Ola.";
  const rendered = healthEmailTemplate({
    title: data.title,
    preview: "Ha uma nova atualizacao disponivel na sua conta.",
    lines: [greeting, ...data.lines],
    details: data.details.map(
      ({ label, value }) => [label, value] as [string, string],
    ),
    actionLabel: data.actionLabel,
    actionUrl,
  });

  return {
    subject: "Maximus World Click - Nova atualizacao na sua conta",
    ...rendered,
  };
}
