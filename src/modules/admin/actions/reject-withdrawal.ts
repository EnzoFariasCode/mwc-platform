"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { WithdrawalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminAuditLog } from "./audit-log";

type WithdrawalDecision = "FAILED" | "CANCELED";

const auditActionByDecision = {
  FAILED: "PIX_WITHDRAWAL_REJECTED",
  CANCELED: "PIX_WITHDRAWAL_CANCELED",
} as const;

function normalizeReason(reason: string) {
  return reason.trim().replace(/\s+/g, " ");
}

export async function rejectWithdrawal(
  withdrawalId: string,
  decision: WithdrawalDecision,
  reason: string,
): Promise<ActionResponse> {
  const admin = await requireAdminUser();
  const normalizedReason = normalizeReason(reason);

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  if (!["FAILED", "CANCELED"].includes(decision)) {
    return { success: false, error: "Decisao de saque invalida." };
  }

  if (normalizedReason.length < 10) {
    return {
      success: false,
      error: "Informe um motivo com pelo menos 10 caracteres.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        select: {
          id: true,
          status: true,
          transactionId: true,
          amount: true,
          pixKey: true,
          pixKeyType: true,
          userId: true,
        },
      });

      if (!withdrawal) {
        throw new Error("Solicitacao de saque nao encontrada.");
      }

      if (
        withdrawal.status !== WithdrawalStatus.PENDING &&
        withdrawal.status !== WithdrawalStatus.PROCESSING
      ) {
        throw new Error("Esta solicitacao de saque ja foi processada.");
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: { status: decision },
      });

      await tx.transaction.update({
        where: { id: withdrawal.transactionId },
        data: {
          status:
            decision === WithdrawalStatus.FAILED ? "FAILED" : "CANCELED",
        },
      });

      await tx.user.update({
        where: { id: withdrawal.userId },
        data: {
          walletBalance: {
            increment: withdrawal.amount,
          },
        },
      });

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: auditActionByDecision[decision],
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: normalizedReason,
        receiptUrl: null,
        metadata: {
          amount: withdrawal.amount.toNumber(),
          pixKey: withdrawal.pixKey,
          pixKeyType: withdrawal.pixKeyType,
          transactionId: withdrawal.transactionId,
          userId: withdrawal.userId,
          restoredToWallet: true,
          finalStatus: decision,
        },
      });
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    return { success: true };
  } catch (error) {
    console.error("[REJECT_WITHDRAWAL_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel processar o saque.",
    };
  }
}
