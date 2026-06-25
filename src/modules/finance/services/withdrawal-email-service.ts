import { sendEmail } from "@/modules/email/email-client";
import { withdrawalRequestedEmail } from "@/modules/email/templates/finance-emails";

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
  const template = withdrawalRequestedEmail({
    name,
    amount: formatCurrency(amount),
    pixKey,
    pixKeyType,
  });

  await sendEmail({
    to: email,
    ...template,
    logPrefix: "WITHDRAWAL_EMAIL",
  });
}
