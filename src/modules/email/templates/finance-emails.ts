import { baseEmail, detailList, paragraph } from "./base-email";

export function withdrawalRequestedEmail({
  name,
  amount,
  pixKey,
  pixKeyType,
  dueAt,
}: {
  name: string | null;
  amount: string;
  pixKey: string;
  pixKeyType: string;
  dueAt: string;
}) {
  const subject = "MWC - Solicitacao de saque Pix recebida";
  const text = [
    `Ola, ${name || "profissional"}.`,
    "",
    "Recebemos sua solicitacao de saque Pix.",
    "",
    `Valor liquido: ${amount}`,
    `Chave Pix: ${pixKeyType} - ${pixKey}`,
    "Status: Aguardando pagamento pela tesouraria",
    `Data estimada de pagamento: ate ${dueAt}`,
    "",
    "O valor ja foi reservado do seu saldo disponivel para evitar duplicidade de saque.",
  ].join("\n");

  const html = baseEmail({
    title: "Solicitacao de saque recebida",
    preview: "Recebemos sua solicitacao de saque Pix.",
    children: [
      paragraph(`Ola, ${name || "profissional"}.`),
      paragraph("Recebemos sua solicitacao de saque Pix."),
      detailList([
        ["Valor liquido", amount],
        ["Chave Pix", `${pixKeyType} - ${pixKey}`],
        ["Status", "Aguardando pagamento pela tesouraria"],
        ["Data estimada de pagamento", `Ate ${dueAt}`],
      ]),
      paragraph(
        "O valor ja foi reservado do seu saldo disponivel para evitar duplicidade de saque.",
      ),
    ].join(""),
  });

  return { subject, text, html };
}

export function withdrawalPaidEmail({
  name,
  amount,
  pixKey,
  pixKeyType,
  providerRef,
  processedAt,
}: {
  name: string | null;
  amount: string;
  pixKey: string;
  pixKeyType: string;
  providerRef: string;
  processedAt: string;
}) {
  const subject = "MWC - Saque Pix pago";
  const text = [
    `Ola, ${name || "profissional"}.`,
    "",
    "Seu saque Pix foi pago.",
    "",
    `Valor: ${amount}`,
    `Chave Pix: ${pixKeyType} - ${pixKey}`,
    `Identificacao da operacao: ${providerRef}`,
    `Pagamento confirmado em: ${processedAt}`,
    "",
    "O comprovante da transferencia esta anexado a este e-mail.",
  ].join("\n");

  const html = baseEmail({
    title: "Saque Pix pago",
    preview: "Seu saque foi pago e o comprovante esta anexado.",
    children: [
      paragraph(`Ola, ${name || "profissional"}.`),
      paragraph("Seu saque Pix foi pago."),
      detailList([
        ["Valor", amount],
        ["Chave Pix", `${pixKeyType} - ${pixKey}`],
        ["Identificacao da operacao", providerRef],
        ["Pagamento confirmado em", processedAt],
      ]),
      paragraph(
        "O comprovante da transferencia esta anexado a este e-mail.",
      ),
    ].join(""),
  });

  return { subject, text, html };
}
