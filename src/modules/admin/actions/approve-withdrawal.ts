"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function approveWithdrawal(
  withdrawalId: string,
): Promise<ActionResponse> {
  await requireAdminUser();

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  try {
    await db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        select: {
          id: true,
          status: true,
          transactionId: true,
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
