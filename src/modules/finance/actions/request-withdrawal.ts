"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getUserSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { sendWithdrawalRequestedEmail } from "@/modules/finance/services/withdrawal-email-service";

const MIN_WITHDRAWAL_AMOUNT = new Prisma.Decimal(50);
const PIX_KEY_TYPES = ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] as const;

function parseMoneyInput(value: FormDataEntryValue | null) {
  const raw = value?.toString().trim();
  if (!raw) return null;

  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue)) return null;

  return new Prisma.Decimal(numberValue).toDecimalPlaces(2);
}

function normalizePixKey(value: FormDataEntryValue | null) {
  return value?.toString().trim() || "";
}

function normalizePixKeyType(value: FormDataEntryValue | null) {
  const type = value?.toString().trim().toUpperCase();
  return PIX_KEY_TYPES.includes(type as (typeof PIX_KEY_TYPES)[number])
    ? type
    : null;
}

export async function requestWithdrawal(
  formData: FormData,
): Promise<ActionResponse<string>> {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Nao autorizado." };

  const amount = parseMoneyInput(formData.get("amount"));
  const pixKey = normalizePixKey(formData.get("pixKey"));
  const pixKeyType = normalizePixKeyType(formData.get("pixKeyType"));

  if (!amount || amount.lessThanOrEqualTo(0)) {
    return { success: false, error: "Informe um valor de saque valido." };
  }

  if (amount.lessThan(MIN_WITHDRAWAL_AMOUNT)) {
    return { success: false, error: "Saldo insuficiente (Minimo R$ 50,00)." };
  }

  if (!pixKeyType) {
    return { success: false, error: "Selecione o tipo da chave Pix." };
  }

  if (pixKey.length < 5) {
    return { success: false, error: "Informe uma chave Pix valida." };
  }

  try {
    const withdrawal = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.id },
        select: { walletBalance: true, email: true, name: true },
      });

      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      if (user.walletBalance.lessThan(amount)) {
        throw new Error("Saldo disponivel insuficiente para este saque.");
      }

      const transaction = await tx.transaction.create({
        data: {
          userId: session.id,
          amount,
          type: "DEBIT",
          status: "PENDING",
          description: `Saque Pix solicitado (${pixKeyType}: ${pixKey})`,
        },
      });

      await tx.withdrawalRequest.create({
        data: {
          userId: session.id,
          transactionId: transaction.id,
          amount,
          pixKey,
          pixKeyType,
          status: "PENDING",
          provider: "MANUAL_PIX",
        },
      });

      await tx.user.update({
        where: { id: session.id },
        data: {
          walletBalance: { decrement: amount },
          pixKey,
          pixKeyType,
        },
      });

      return {
        email: user.email,
        name: user.name,
        amount,
        pixKey,
        pixKeyType,
      };
    });

    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    await sendWithdrawalRequestedEmail(withdrawal);

    return {
      success: true,
      data: "Solicitacao de saque Pix registrada. Pagamento pendente de processamento.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro ao processar saque.",
    };
  }
}
