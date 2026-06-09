import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM_EMAIL || "MWC Online <onboarding@resend.dev>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function formatCurrency(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "Nao informado";

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export async function sendWithdrawalRequestedEmail({
  email,
  name,
  amount,
  pixKey,
  pixKeyType,
}: {
  email: string | null;
  name: string | null;
  amount: unknown;
  pixKey: string;
  pixKeyType: string;
}) {
  if (!email) return;

  const text = [
    `Ola, ${name || "profissional"}.`,
    "",
    "Recebemos sua solicitacao de saque Pix.",
    "",
    `Valor: ${formatCurrency(amount)}`,
    `Chave Pix: ${pixKeyType} - ${pixKey}`,
    "Status: Pendente de processamento",
    "",
    "O valor ja foi reservado do seu saldo disponivel para evitar duplicidade de saque.",
  ].join("\n");

  if (!resend) {
    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`[WITHDRAWAL_EMAIL] ${email}\n${text}`);
    }
    return;
  }

  try {
    await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: "MWC Online - Solicitacao de saque Pix recebida",
      text,
    });
  } catch (error) {
    console.error("[WITHDRAWAL_EMAIL_ERROR]", error);
  }
}
