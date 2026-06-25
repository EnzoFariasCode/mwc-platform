import { actionButton, baseEmail, detailList, paragraph } from "./base-email";

type Detail = [string, string | null | undefined];

function detailsHtml(items: Detail[]) {
  return detailList(items);
}

export function healthEmailTemplate({
  title,
  preview,
  lines,
  details,
  actionLabel,
  actionUrl,
}: {
  title: string;
  preview: string;
  lines: Array<string | null | undefined>;
  details: Detail[];
  actionLabel?: string;
  actionUrl?: string;
}) {
  const bodyLines = lines.filter(Boolean) as string[];
  const text = [
    ...bodyLines,
    "",
    ...details
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`),
    actionUrl ? "" : null,
    actionUrl ? `${actionLabel || "Acompanhar"}: ${actionUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = baseEmail({
    title,
    preview,
    children: [
      ...bodyLines.map((line) => paragraph(line)),
      detailsHtml(details),
      actionUrl && actionLabel ? actionButton(actionLabel, actionUrl) : "",
    ].join(""),
  });

  return { text, html };
}
