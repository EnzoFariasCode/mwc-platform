import "server-only";

import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[] | null | undefined;
  subject: string;
  text: string;
  html?: string;
  logPrefix?: string;
  failWhenMissingConfig?: boolean;
};

type SendEmailResult = {
  success: boolean;
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
  logPrefix = "EMAIL",
  failWhenMissingConfig = false,
}: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (recipients.length === 0) return { success: true };

  if (!resend || !resendFrom) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[${logPrefix}] ${subject} -> ${recipients.join(", ")}\n${text}`);
    }

    if (failWhenMissingConfig) {
      return { success: false, error: "Servico de e-mail nao configurado." };
    }

    return { success: true };
  }

  try {
    await resend.emails.send({
      from: resendFrom,
      to: recipients,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    return { success: true };
  } catch (error) {
    console.error(`[${logPrefix}_ERROR]`, error);
    return { success: false, error: "Erro ao enviar e-mail." };
  }
}
