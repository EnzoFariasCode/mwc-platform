import { baseEmail, detailList, paragraph } from "./base-email";

export function withdrawalRequestedEmail({
  name,
  amount,
  pixKey,
  pixKeyType,
}: {
  name: string | null;
  amount: string;
  pixKey: string;
  pixKeyType: string;
}) {
  const subject = "MWC Online - Solicitacao de saque Pix recebida";
  const text = [
    `Ola, ${name || "profissional"}.`,
    "",
    "Recebemos sua solicitacao de saque Pix.",
    "",
    `Valor: ${amount}`,
    `Chave Pix: ${pixKeyType} - ${pixKey}`,
    "Status: Pendente de processamento",
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
        ["Valor", amount],
        ["Chave Pix", `${pixKeyType} - ${pixKey}`],
        ["Status", "Pendente de processamento"],
      ]),
      paragraph(
        "O valor ja foi reservado do seu saldo disponivel para evitar duplicidade de saque.",
      ),
    ].join(""),
  });

  return { subject, text, html };
}
