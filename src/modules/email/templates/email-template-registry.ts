import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { baseEmail, paragraph } from "./base-email";
import {
  renderTechTransactionalEmail,
  TECH_EMAIL_TEMPLATE_KEYS,
} from "./tech-emails";
import {
  HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS,
  renderHealthOnlineTransactionalEmail,
} from "./health-online-emails";
import {
  ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS,
  renderAdminFinanceTransactionalEmail,
} from "./admin-finance-emails";
import {
  AUTH_EMAIL_TEMPLATE_KEYS,
  renderAuthTransactionalEmail,
} from "./auth-emails";

export type RenderedTransactionalEmail = {
  subject: string;
  text: string;
  html: string;
};

type EmailTemplateRenderer = (
  payload: Prisma.JsonValue,
) => RenderedTransactionalEmail;

export class EmailTemplateNotFoundError extends Error {
  readonly code = "EMAIL_TEMPLATE_NOT_FOUND";

  constructor(templateKey: string, templateVersion: number) {
    super(`Template ${templateKey}:v${templateVersion} nao registrado.`);
    this.name = "EmailTemplateNotFoundError";
  }
}

export class EmailTemplatePayloadError extends Error {
  readonly code = "EMAIL_TEMPLATE_PAYLOAD_INVALID";

  constructor(templateKey: string, templateVersion: number) {
    super(`Payload invalido para ${templateKey}:v${templateVersion}.`);
    this.name = "EmailTemplatePayloadError";
  }
}

const smokeTestPayloadSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
  })
  .strict();

const templateRegistry = new Map<string, EmailTemplateRenderer>([
  [
    "system.smoke-test:v1",
    (payload) => {
      const parsed = smokeTestPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        throw new EmailTemplatePayloadError("system.smoke-test", 1);
      }

      const subject = "Maximus World Click - Teste do sistema de e-mails";
      const text = [
        "Teste controlado do sistema transacional de e-mails.",
        "",
        parsed.data.message,
      ].join("\n");
      const html = baseEmail({
        brandName: "Maximus World Click",
        title: "Teste do sistema de e-mails",
        preview: "Validacao controlada da caixa de saida transacional.",
        children: [
          paragraph("Teste controlado do sistema transacional de e-mails."),
          paragraph(parsed.data.message),
        ].join(""),
      });

      return { subject, text, html };
    },
  ],
  ...TECH_EMAIL_TEMPLATE_KEYS.map(
    (templateKey) =>
      [`${templateKey}:v1`, renderTechTransactionalEmail] as const,
  ),
  ...HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS.map(
    (templateKey) =>
      [`${templateKey}:v1`, renderHealthOnlineTransactionalEmail] as const,
  ),
  ...ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS.map(
    (templateKey) =>
      [`${templateKey}:v1`, renderAdminFinanceTransactionalEmail] as const,
  ),
  ...AUTH_EMAIL_TEMPLATE_KEYS.map(
    (templateKey) =>
      [`${templateKey}:v1`, renderAuthTransactionalEmail] as const,
  ),
]);

function registryKey(templateKey: string, templateVersion: number) {
  return `${templateKey}:v${templateVersion}`;
}

export function renderTransactionalEmailTemplate({
  templateKey,
  templateVersion,
  payload,
}: {
  templateKey: string;
  templateVersion: number;
  payload: Prisma.JsonValue;
}) {
  const renderer = templateRegistry.get(registryKey(templateKey, templateVersion));
  if (!renderer) {
    throw new EmailTemplateNotFoundError(templateKey, templateVersion);
  }

  try {
    return renderer(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EmailTemplatePayloadError(templateKey, templateVersion);
    }
    throw error;
  }
}
