"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { ActionResponse } from "@/modules/users/types/user-types";
import {
  claimWithdrawalTransition,
  transitionWithdrawalTransaction,
} from "@/modules/admin/services/withdrawal-state-transition";

export async function startWithdrawalProcessing(
  withdrawalId: string,
): Promise<ActionResponse> {
  const admin = await requireAdminRole(["OWNER", "FINANCE"]);

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  try {
    const withdrawal = await db.$transaction(async (tx) => {
      const current = await tx.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        select: {
          id: true,
          userId: true,
          status: true,
          dueAt: true,
          transactionId: true,
        },
      });

      if (!current) throw new Error("Solicitacao de saque nao encontrada.");
      if (current.status !== "PENDING") {
        throw new Error("Somente saques pendentes podem iniciar processamento.");
      }

      await claimWithdrawalTransition(tx, {
        withdrawalId: current.id,
        expectedStatuses: ["PENDING"],
        nextStatus: "PROCESSING",
      });

      await transitionWithdrawalTransaction(tx, {
        transactionId: current.transactionId,
        expectedStatuses: ["PENDING"],
        nextStatus: "PROCESSING",
      });

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "WITHDRAWAL_PROCESSING_STARTED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: current.id,
        reason: "Processamento manual iniciado pela tesouraria.",
        metadata: { dueAt: current.dueAt.toISOString() },
      });

      return current;
    });

    await upsertNotification({
      userId: withdrawal.userId,
      actorId: admin.id,
      type: "INFO",
      eventType: "WITHDRAWAL_PROCESSING",
      title: "Saque em processamento",
      message: `A tesouraria iniciou o processamento. Prazo: ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
      link: "/dashboard/financeiro",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: withdrawal.id,
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar o processamento.",
    };
  }
}
