import "server-only";

import { Resend } from "resend";

type SendEmailInput = {
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
};

type SendEmailResult = {
  success: boolean;
  id?: string;
  error?: string;
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
}: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (recipients.length === 0) {
    console.error(`[${logPrefix}_ERROR]`, "E-mail sem destinatario.");
    return { success: false, error: "Destinatario de e-mail nao informado." };
  }

  if (!resend || !resendFrom) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[${logPrefix}] ${subject} -> ${recipients.join(", ")}\n${text}`);
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
    };
  }

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error(`[${logPrefix}_ERROR]`, {
        name: error.name,
        statusCode: error.statusCode,
        message: error.message,
      });
      return { success: false, error: "Erro ao enviar e-mail." };
    }

    if (!data?.id) {
      console.error(
        `[${logPrefix}_ERROR]`,
        "Resend nao retornou o identificador do e-mail.",
      );
      return { success: false, error: "Resposta invalida do servico de e-mail." };
    }

    console.info(`[${logPrefix}_SENT]`, {
      id: data.id,
      recipientCount: recipients.length,
    });

    return { success: true, id: data.id };
  } catch (error) {
    console.error(`[${logPrefix}_ERROR]`, error);
    return { success: false, error: "Erro ao enviar e-mail." };
  }
}
