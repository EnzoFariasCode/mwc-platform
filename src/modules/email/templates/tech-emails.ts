import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { actionButton, baseEmail, detailList, paragraph } from "./base-email";

const techEmailDetailSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(500),
  })
  .strict();

const techEmailPayloadSchema = z
  .object({
    recipientName: z.string().trim().min(1).max(160).nullable(),
    title: z.string().trim().min(1).max(120),
    preview: z.string().trim().min(1).max(180),
    lines: z.array(z.string().trim().min(1).max(1_000)).min(1).max(8),
    details: z.array(techEmailDetailSchema).max(8).default([]),
    actionLabel: z.string().trim().min(1).max(80),
    actionPath: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .refine(
        (value) => value === "/dashboard" || value.startsWith("/dashboard/"),
        "O destino deve pertencer ao painel.",
      ),
  })
  .strict();

export const TECH_EMAIL_TEMPLATE_KEYS = [
  "tech.chat.unread",
  "tech.chat.started",
  "tech.proposal.received",
  "tech.proposal.accepted",
  "tech.proposal.rejected",
  "tech.proposal.withdrawn",
  "tech.project.started",
  "tech.delivery.submitted",
  "tech.revision.requested",
  "tech.project.canceled",
  "tech.project.completed",
  "tech.dispute.opened",
  "tech.dispute.resolved",
] as const;

export type TechEmailTemplateKey = (typeof TECH_EMAIL_TEMPLATE_KEYS)[number];

function appUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.maximusworldclick.com.br";

  try {
    return new URL(configured).origin;
  } catch {
    return "https://www.maximusworldclick.com.br";
  }
}

export function renderTechTransactionalEmail(payload: Prisma.JsonValue) {
  const data = techEmailPayloadSchema.parse(payload);
  const actionUrl = new URL(data.actionPath, appUrl()).toString();
  const greeting = data.recipientName
    ? `Ola, ${data.recipientName}.`
    : "Ola.";
  const details = data.details.map(
    ({ label, value }) => [label, value] as [string, string],
  );
  const text = [
    greeting,
    ...data.lines,
    ...data.details.map(({ label, value }) => `${label}: ${value}`),
    `Acessar: ${actionUrl}`,
  ].join("\n\n");
  const html = baseEmail({
    brandName: "Maximus World Click",
    title: data.title,
    preview: data.preview,
    children: [
      paragraph(greeting),
      ...data.lines.map(paragraph),
      details.length > 0 ? detailList(details) : "",
      actionButton(data.actionLabel, actionUrl),
    ].join(""),
  });

  return {
    subject: `Maximus World Click - ${data.title}`,
    text,
    html,
  };
}
