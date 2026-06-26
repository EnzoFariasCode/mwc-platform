import "server-only";

export async function sendAdminNotification({
  subject,
  lines,
  actionUrl,
}: {
  subject: string;
  lines: Array<string | null | undefined>;
  actionUrl?: string | null;
}) {
  if (process.env.ENABLE_DEV_TOOLS === "true") {
    console.log(
      [
        `[ADMIN_NOTIFICATION_DISABLED] ${subject}`,
        ...lines.filter(Boolean),
        actionUrl ? `Abrir no painel: ${actionUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}
