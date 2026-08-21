import "server-only";

import { Resend } from "resend";
import {
  classifyEmailException,
  classifyResendError,
  type EmailDeliveryErrorCategory,
} from "./email-delivery-error";

export type SendEmailInput = {
  to: string | string[] | null | undefined;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    content: Buffer | string;
    filename: string;
    contentType?: string;
  }>;
  logPrefix?: string;
  failWhenMissingConfig?: boolean;
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { success: true; id: string; error?: undefined }
  | {
      success: false;
      error: string;
      errorCode: string;
      errorCategory: EmailDeliveryErrorCategory;
      statusCode: number | null;
      retryable: boolean;
      detail: string;
    };

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL;
const resend = resendApiKey && resendFrom ? new Resend(resendApiKey) : null;

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
  logPrefix = "EMAIL",
  failWhenMissingConfig = false,
  idempotencyKey,
}: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (recipients.length === 0) {
    console.error(`[${logPrefix}_ERROR]`, "E-mail sem destinatario.");
    return {
      success: false,
      error: "Destinatario de e-mail nao informado.",
      errorCode: "EMAIL_RECIPIENT_MISSING",
      errorCategory: "VALIDATION",
      statusCode: null,
      retryable: false,
      detail: "Destinatario de e-mail nao informado.",
    };
  }

  const normalizedIdempotencyKey = idempotencyKey?.trim();
  if (
    idempotencyKey !== undefined &&
    (!normalizedIdempotencyKey || normalizedIdempotencyKey.length > 256)
  ) {
    console.error(`[${logPrefix}_ERROR]`, {
      code: "EMAIL_IDEMPOTENCY_KEY_INVALID",
    });
    return {
      success: false,
      error: "Chave de idempotencia do e-mail invalida.",
      errorCode: "EMAIL_IDEMPOTENCY_KEY_INVALID",
      errorCategory: "VALIDATION",
      statusCode: null,
      retryable: false,
      detail: "A chave de idempotencia deve ter entre 1 e 256 caracteres.",
    };
  }

  if (!resend || !resendFrom) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[${logPrefix}_DEV_DELIVERY_SKIPPED]`, {
        recipientCount: recipients.length,
      });
    }

    console.error(`[${logPrefix}_CONFIG_ERROR]`, {
      hasApiKey: Boolean(resendApiKey),
      hasFrom: Boolean(resendFrom),
    });

    return {
      success: false,
      error: failWhenMissingConfig
        ? "Servico de e-mail nao configurado."
        : "E-mail nao enviado: servico nao configurado.",
      errorCode: "EMAIL_NOT_CONFIGURED",
      errorCategory: "CONFIGURATION",
      statusCode: null,
      retryable: false,
      detail: "RESEND_API_KEY ou RESEND_FROM_EMAIL nao configurado.",
    };
  }

  try {
    const payload = {
      from: resendFrom,
      to: recipients,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(attachments?.length
        ? {
            attachments: attachments.map((attachment) => ({
              content: attachment.content,
              filename: attachment.filename,
              ...(attachment.contentType
                ? { content_type: attachment.contentType }
                : {}),
            })),
          }
        : {}),
    };
    const { data, error } = normalizedIdempotencyKey
      ? await resend.emails.send(payload, {
          idempotencyKey: normalizedIdempotencyKey,
        })
      : await resend.emails.send(payload);

    if (error) {
      const classified = classifyResendError(error);
      console.error(`[${logPrefix}_ERROR]`, {
        code: classified.code,
        category: classified.category,
        statusCode: classified.statusCode,
        retryable: classified.retryable,
      });
      return {
        success: false,
        error: "Erro ao enviar e-mail.",
        errorCode: classified.code,
        errorCategory: classified.category,
        statusCode: classified.statusCode,
        retryable: classified.retryable,
        detail: classified.safeMessage,
      };
    }

    if (!data?.id) {
      console.error(
        `[${logPrefix}_ERROR]`,
        "Resend nao retornou o identificador do e-mail.",
      );
      return {
        success: false,
        error: "Resposta invalida do servico de e-mail.",
        errorCode: "EMAIL_PROVIDER_INVALID_RESPONSE",
        errorCategory: "PROVIDER",
        statusCode: null,
        retryable: true,
        detail: "Resend nao retornou o identificador do e-mail.",
      };
    }

    console.info(`[${logPrefix}_SENT]`, {
      id: data.id,
      recipientCount: recipients.length,
    });

    return { success: true, id: data.id };
  } catch (error) {
    const classified = classifyEmailException(error);
    console.error(`[${logPrefix}_ERROR]`, {
      code: classified.code,
      category: classified.category,
      retryable: classified.retryable,
    });
    return {
      success: false,
      error: "Erro ao enviar e-mail.",
      errorCode: classified.code,
      errorCategory: classified.category,
      statusCode: classified.statusCode,
      retryable: classified.retryable,
      detail: classified.safeMessage,
    };
  }
}
