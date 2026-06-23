import "server-only";

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br";
const resend = resendApiKey && resendFrom ? new Resend(resendApiKey) : null;

function getAdminRecipients() {
  const raw =
    process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAILS || "";

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendAdminNotification({
  subject,
  lines,
  actionUrl,
}: {
  subject: string;
  lines: Array<string | null | undefined>;
  actionUrl?: string | null;
}) {
  const recipients = getAdminRecipients();
  if (recipients.length === 0) return;

  const text = [
    "Alerta administrativo MWC",
    "",
    ...lines.filter(Boolean),
    actionUrl ? "" : null,
    actionUrl ? `Abrir no painel: ${actionUrl}` : null,
    "",
    `Painel admin: ${appUrl}/dashboard/admin`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!resend || !resendFrom) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[ADMIN_NOTIFICATION] ${subject} -> ${recipients.join(", ")}\n${text}`);
    }
    return;
  }

  try {
    await resend.emails.send({
      from: resendFrom,
      to: recipients,
      subject,
      text,
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION_ERROR]", error);
  }
}
