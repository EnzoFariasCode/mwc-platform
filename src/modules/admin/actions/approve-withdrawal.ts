"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";

const ADMIN_WITHDRAWAL_DECISION_LIMIT = 30;
const ADMIN_WITHDRAWAL_DECISION_WINDOW_MS = 10 * 60 * 1000;

export async function approveWithdrawal(
  withdrawalId: string,
): Promise<ActionResponse> {
  const admin = await requireAdminUser();

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  const rateLimitError = await consumeRateLimit({
    key: `admin:withdrawal-decision:user:${admin.id}`,
    limit: ADMIN_WITHDRAWAL_DECISION_LIMIT,
    windowMs: ADMIN_WITHDRAWAL_DECISION_WINDOW_MS,
    message: "Muitas decisoes financeiras em sequencia. Aguarde um instante.",
  });

  if (rateLimitError) {
    return { success: false, error: rateLimitError };
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

      if (withdrawal.status !== "PENDING") {
        throw new Error("Esta solicitacao de saque ja foi processada.");
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: { status: "COMPLETED" },
      });

      await tx.transaction.update({
        where: { id: withdrawal.transactionId },
        data: { status: "COMPLETED" },
      });

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_MARK_COMPLETED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: "Saque PIX marcado como transferido pela tesouraria.",
        receiptUrl: null,
        metadata: {
          amount: withdrawal.amount.toNumber(),
          pixKey: withdrawal.pixKey,
          pixKeyType: withdrawal.pixKeyType,
          transactionId: withdrawal.transactionId,
          userId: withdrawal.userId,
        },
      });
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    return { success: true };
  } catch (error) {
    console.error("[APPROVE_WITHDRAWAL_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel aprovar o saque.",
    };
  }
}
