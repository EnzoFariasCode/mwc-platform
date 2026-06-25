import { actionButton, baseEmail, paragraph } from "./base-email";

export function adminNotificationEmail({
  subject,
  lines,
  actionUrl,
  adminUrl,
}: {
  subject: string;
  lines: Array<string | null | undefined>;
  actionUrl?: string | null;
  adminUrl: string;
}) {
  const safeLines = lines.filter(Boolean) as string[];
  const text = [
    "Alerta administrativo MWC",
    "",
    ...safeLines,
    actionUrl ? "" : null,
    actionUrl ? `Abrir no painel: ${actionUrl}` : null,
    "",
    `Painel admin: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = baseEmail({
    title: "Alerta administrativo",
    preview: subject,
    children: [
      ...safeLines.map((line) => paragraph(line)),
      actionUrl ? actionButton("Abrir no painel", actionUrl) : "",
      paragraph(`Painel admin: ${adminUrl}`),
    ].join(""),
  });

  return { text, html };
}
