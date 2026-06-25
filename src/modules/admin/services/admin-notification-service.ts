import "server-only";

import { sendEmail } from "@/modules/email/email-client";
import { adminNotificationEmail } from "@/modules/email/templates/admin-emails";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br";

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

  const template = adminNotificationEmail({
    subject,
    lines,
    actionUrl,
    adminUrl: `${appUrl}/dashboard/admin`,
  });

  await sendEmail({
    to: recipients,
    subject,
    ...template,
    logPrefix: "ADMIN_NOTIFICATION",
  });
}
