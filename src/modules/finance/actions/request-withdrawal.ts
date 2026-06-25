"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getUserSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { sendWithdrawalRequestedEmail } from "@/modules/finance/services/withdrawal-email-service";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { sendAdminNotification } from "@/modules/admin/services/admin-notification-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

const MIN_WITHDRAWAL_AMOUNT = new Prisma.Decimal(50);
const PIX_KEY_TYPES = ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] as const;
const WITHDRAWAL_LIMIT = 3;
const WITHDRAWAL_WINDOW_MS = 60 * 60 * 1000;

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

  if (session.userType !== "PROFESSIONAL") {
    return {
      success: false,
      error: "Ação restrita a profissionais.",
    };
  }

  const rateLimitError = await consumeRateLimit({
    key: `finance:withdrawal:user:${session.id}`,
    limit: WITHDRAWAL_LIMIT,
    windowMs: WITHDRAWAL_WINDOW_MS,
    message: "Muitas solicitacoes de saque. Tente novamente mais tarde.",
  });

  if (rateLimitError) {
    return { success: false, error: rateLimitError };
  }

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

      const withdrawalRequest = await tx.withdrawalRequest.create({
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

      const debit = await tx.user.updateMany({
        where: {
          id: session.id,
          walletBalance: { gte: amount },
        },
        data: {
          walletBalance: { decrement: amount },
          pixKey,
          pixKeyType,
        },
      });

      if (debit.count !== 1) {
        throw new Error("Saldo disponivel insuficiente para este saque.");
      }

      return {
        id: withdrawalRequest.id,
        email: user.email,
        name: user.name,
        amount,
        pixKey,
        pixKeyType,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    await sendWithdrawalRequestedEmail(withdrawal);
    await upsertNotification({
      userId: session.id,
      type: "INFO",
      eventType: "WITHDRAWAL_REQUESTED",
      title: "Saque solicitado",
      message: "Sua solicitacao de saque PIX foi registrada e esta pendente de processamento.",
      link: "/dashboard/financeiro",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: withdrawal.id,
      metadata: {
        amount: withdrawal.amount.toNumber(),
        pixKey: withdrawal.pixKey,
        pixKeyType: withdrawal.pixKeyType,
      },
    });
    await sendAdminNotification({
      subject: "MWC Admin - Novo saque PIX pendente",
      lines: [
        "Um profissional solicitou saque PIX.",
        `Profissional: ${withdrawal.name || "Nao informado"}`,
        `Email: ${withdrawal.email || "Nao informado"}`,
        `Valor: ${withdrawal.amount.toNumber().toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
        `Chave PIX: ${withdrawal.pixKeyType} - ${withdrawal.pixKey}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/financeiro`,
    });

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
