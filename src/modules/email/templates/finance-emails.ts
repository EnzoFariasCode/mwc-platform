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
  const subject = "MWC Online - Solicitacao de saque Pix recebida";
  const text = [
    `Ola, ${name || "profissional"}.`,
    "",
    "Recebemos sua solicitacao de saque Pix.",
    "",
    `Valor liquido: ${amount}`,
    `Chave Pix: ${pixKeyType} - ${pixKey}`,
    "Status: Pendente de processamento",
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
        ["Status", "Pendente de processamento"],
        ["Data estimada de pagamento", `Ate ${dueAt}`],
      ]),
      paragraph(
        "O valor ja foi reservado do seu saldo disponivel para evitar duplicidade de saque.",
      ),
    ].join(""),
  });

  return { subject, text, html };
}
