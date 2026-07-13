"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { ActionResponse } from "@/modules/users/types/user-types";

const ADMIN_WITHDRAWAL_DECISION_LIMIT = 30;
const ADMIN_WITHDRAWAL_DECISION_WINDOW_MS = 10 * 60 * 1000;
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function approveWithdrawal(
  formData: FormData,
): Promise<ActionResponse> {
  const admin = await requireAdminRole(["OWNER", "FINANCE"]);
  const withdrawalId = formData.get("withdrawalId")?.toString().trim();
  const providerRef = formData.get("providerRef")?.toString().trim();
  const receipt = formData.get("receipt");

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }
  if (!providerRef || providerRef.length < 5 || providerRef.length > 120) {
    return {
      success: false,
      error: "Informe a identificacao da operacao realizada.",
    };
  }
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { success: false, error: "Anexe o comprovante da transferencia." };
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return { success: false, error: "O comprovante deve ter no maximo 5 MB." };
  }
  if (!ALLOWED_RECEIPT_TYPES.has(receipt.type)) {
    return { success: false, error: "Envie um PDF, JPG, PNG ou WEBP." };
  }

  const rateLimitError = await consumeRateLimit({
    key: `admin:withdrawal-decision:user:${admin.id}`,
    limit: ADMIN_WITHDRAWAL_DECISION_LIMIT,
    windowMs: ADMIN_WITHDRAWAL_DECISION_WINDOW_MS,
    message: "Muitas decisoes financeiras em sequencia. Aguarde um instante.",
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const receiptBytes = Buffer.from(await receipt.arrayBuffer());
    const processedAt = new Date();
    const approved = await db.$transaction(async (tx) => {
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
          dueAt: true,
        },
      });

      if (!withdrawal) throw new Error("Solicitacao de saque nao encontrada.");
      if (withdrawal.status !== "PROCESSING") {
        throw new Error(
          "Inicie o processamento antes de concluir a transferencia.",
        );
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: "COMPLETED",
          providerRef,
          processedAt,
          failedAt: null,
          failureReason: null,
        },
      });
      await tx.transaction.update({
        where: { id: withdrawal.transactionId },
        data: { status: "COMPLETED" },
      });

      const audit = await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_MARK_COMPLETED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: `Transferencia manual concluida. Operacao: ${providerRef}.`,
        receiptFile: {
          bytes: receiptBytes,
          type: receipt.type,
          name: receipt.name,
        },
        metadata: {
          amount: withdrawal.amount.toNumber(),
          pixKey: withdrawal.pixKey,
          pixKeyType: withdrawal.pixKeyType,
          transactionId: withdrawal.transactionId,
          userId: withdrawal.userId,
          providerRef,
          dueAt: withdrawal.dueAt.toISOString(),
          processedAt: processedAt.toISOString(),
          processedWithinDeadline: processedAt <= withdrawal.dueAt,
        },
      });

      return {
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        receiptUrl: audit.receiptUrl,
        providerRef,
      };
    });

    await upsertNotification({
      userId: approved.userId,
      actorId: admin.id,
      type: "SUCCESS",
      eventType: "WITHDRAWAL_COMPLETED",
      title: "Saque pago",
      message: `Seu saque foi pago. Identificacao da operacao: ${approved.providerRef}.`,
      link: "/dashboard/financeiro",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: approved.id,
      metadata: {
        amount: approved.amount.toNumber(),
        providerRef: approved.providerRef,
        receiptUrl: approved.receiptUrl,
      },
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
          : "Nao foi possivel concluir o saque.",
    };
  }
}
