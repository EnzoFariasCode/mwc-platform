const brandColor = "#d73cbe";
const pageBackground = "#020617";
const cardBackground = "#0f172a";
const borderColor = "#1e293b";
const textColor = "#e2e8f0";
const mutedColor = "#94a3b8";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;color:${textColor};font-size:15px;line-height:1.6;">${escapeHtml(text)}</p>`;
}

export function detailList(items: Array<[string, string | null | undefined]>) {
  const rows = items
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;color:${mutedColor};font-size:13px;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:${textColor};font-size:13px;font-weight:700;text-align:right;">${escapeHtml(value || "")}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" width="100%" style="margin:8px 0 20px;border-collapse:collapse;border-top:1px solid ${borderColor};border-bottom:1px solid ${borderColor};">
      ${rows}
    </table>
  `;
}

export function actionButton(label: string, href: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;margin:8px 0 20px;padding:13px 18px;border-radius:12px;background:${brandColor};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
      ${escapeHtml(label)}
    </a>
  `;
}

export function baseEmail({
  title,
  preview,
  children,
}: {
  title: string;
  preview?: string;
  children: string;
}) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:${pageBackground};font-family:Arial,Helvetica,sans-serif;">
        ${preview ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>` : ""}
        <div style="padding:32px 16px;">
          <div style="max-width:600px;margin:0 auto;border:1px solid ${borderColor};border-radius:18px;background:${cardBackground};padding:32px;">
            <div style="margin-bottom:24px;">
              <div style="color:${brandColor};font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">MWC Online</div>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
            </div>
            ${children}
            <p style="margin:28px 0 0;color:#64748b;font-size:12px;line-height:1.5;">
              Esta mensagem foi enviada automaticamente pela MWC Online. Se voce nao reconhece esta atividade, ignore este e-mail ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
