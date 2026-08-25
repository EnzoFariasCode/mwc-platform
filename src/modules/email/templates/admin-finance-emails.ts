import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { actionButton, baseEmail, detailList, paragraph } from "./base-email";

const detailSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(1_000),
  })
  .strict();

const adminFinancePayloadSchema = z
  .object({
    recipientName: z.string().trim().min(1).max(160).nullable(),
    title: z.string().trim().min(1).max(120),
    preview: z.string().trim().min(1).max(180),
    lines: z.array(z.string().trim().min(1).max(1_500)).min(1).max(10),
    details: z.array(detailSchema).max(12).default([]),
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
    attachmentAuditLogId: z.string().uuid().optional(),
  })
  .strict();

export const ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS = [
  "finance.withdrawal.requested",
  "finance.withdrawal.paid",
  "admin.verification.submitted",
  "admin.verification.decision",
  "admin.report.created",
  "admin.report.decision",
  "admin.dispute.alert",
  "admin.critical.alert",
] as const;

export type AdminFinanceEmailTemplateKey =
  (typeof ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS)[number];

function appOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.maximusworldclick.com.br";
  try {
    return new URL(configured).origin;
  } catch {
    return "https://www.maximusworldclick.com.br";
  }
}

export function renderAdminFinanceTransactionalEmail(
  payload: Prisma.JsonValue,
) {
  const data = adminFinancePayloadSchema.parse(payload);
  const actionUrl = new URL(data.actionPath, appOrigin()).toString();
  const greeting = data.recipientName
    ? `Ola, ${data.recipientName}.`
    : "Ola.";
  const html = baseEmail({
    brandName: "Maximus World Click",
    title: data.title,
    preview: data.preview,
    children: [
      paragraph(greeting),
      ...data.lines.map((line) => paragraph(line)),
      data.details.length
        ? detailList(data.details.map(({ label, value }) => [label, value]))
        : "",
      actionButton(data.actionLabel, actionUrl),
    ].join(""),
  });
  const text = [
    greeting,
    "",
    ...data.lines,
    "",
    ...data.details.map(({ label, value }) => `${label}: ${value}`),
    "",
    `${data.actionLabel}: ${actionUrl}`,
  ].join("\n");

  return {
    subject: `Maximus World Click - ${data.title}`,
    text,
    html,
  };
}
