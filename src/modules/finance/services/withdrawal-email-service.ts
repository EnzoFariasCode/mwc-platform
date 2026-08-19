import { sendEmail } from "@/modules/email/email-client";
import {
  withdrawalPaidEmail,
  withdrawalRequestedEmail,
} from "@/modules/email/templates/finance-emails";

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
  dueAt,
}: {
  email: string | null;
  name: string | null;
  amount: unknown;
  pixKey: string;
  pixKeyType: string;
  dueAt: Date;
}) {
  const template = withdrawalRequestedEmail({
    name,
    amount: formatCurrency(amount),
    pixKey,
    pixKeyType,
    dueAt: dueAt.toLocaleDateString("pt-BR"),
  });

  await sendEmail({
    to: email,
    ...template,
    logPrefix: "WITHDRAWAL_EMAIL",
  });
}

export async function sendWithdrawalPaidEmail({
  email,
  name,
  amount,
  pixKey,
  pixKeyType,
  providerRef,
  processedAt,
  receipt,
}: {
  email: string | null;
  name: string | null;
  amount: unknown;
  pixKey: string;
  pixKeyType: string;
  providerRef: string;
  processedAt: Date;
  receipt: {
    bytes: Buffer;
    contentType: string;
    fileName: string;
  };
}) {
  const template = withdrawalPaidEmail({
    name,
    amount: formatCurrency(amount),
    pixKey,
    pixKeyType,
    providerRef,
    processedAt: processedAt.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
  });

  return sendEmail({
    to: email,
    ...template,
    attachments: [
      {
        content: receipt.bytes,
        filename: receipt.fileName,
        contentType: receipt.contentType,
      },
    ],
    logPrefix: "WITHDRAWAL_PAID_EMAIL",
  });
}
