"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { ActionResponse } from "@/modules/users/types/user-types";
import {
  claimWithdrawalTransition,
  transitionWithdrawalTransaction,
} from "@/modules/admin/services/withdrawal-state-transition";
import { validateWithdrawalReceipt } from "@/modules/admin/lib/withdrawal-receipt";
import { sendWithdrawalPaidEmail } from "@/modules/finance/services/withdrawal-email-service";
import { Prisma } from "@prisma/client";

const ADMIN_WITHDRAWAL_DECISION_LIMIT = 30;
const ADMIN_WITHDRAWAL_DECISION_WINDOW_MS = 10 * 60 * 1000;
export async function approveWithdrawal(
  formData: FormData,
): Promise<ActionResponse<{ emailSent: boolean }>> {
  const admin = await requireAdminRole(["OWNER", "FINANCE"]);
  const withdrawalId = formData.get("withdrawalId")?.toString().trim();
  const providerRef = formData
    .get("providerRef")
    ?.toString()
    .trim()
    .replace(/\s+/g, " ");
  const paymentConfirmed = formData.get("paymentConfirmed") === "true";

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }
  if (!providerRef || providerRef.length < 5 || providerRef.length > 120) {
    return {
      success: false,
      error: "Informe a identificacao da operacao realizada.",
    };
  }
  if (!paymentConfirmed) {
    return {
      success: false,
      error: "Confirme que o Pix ja foi realizado antes de marcar como pago.",
    };
  }

  const receiptResult = await validateWithdrawalReceipt(
    formData.get("receipt"),
  );
  if (!receiptResult.success) return receiptResult;

  const rateLimitError = await consumeRateLimit({
    key: `admin:withdrawal-decision:user:${admin.id}`,
    limit: ADMIN_WITHDRAWAL_DECISION_LIMIT,
    windowMs: ADMIN_WITHDRAWAL_DECISION_WINDOW_MS,
    message: "Muitas decisoes financeiras em sequencia. Aguarde um instante.",
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const receipt = receiptResult.receipt;
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
          user: {
            select: { email: true, name: true, industry: true },
          },
        },
      });

      if (!withdrawal) throw new Error("Solicitacao de saque nao encontrada.");
      if (
        withdrawal.status !== "PENDING" &&
        withdrawal.status !== "PROCESSING"
      ) {
        throw new Error("Esta solicitacao de saque ja foi processada.");
      }

      const duplicateOperation = await tx.withdrawalRequest.findFirst({
        where: {
          id: { not: withdrawal.id },
          providerRef,
          status: "COMPLETED",
        },
        select: { id: true },
      });
      if (duplicateOperation) {
        throw new Error(
          "Esta identificacao de operacao ja foi usada em outro saque.",
        );
      }

      await claimWithdrawalTransition(tx, {
        withdrawalId: withdrawal.id,
        expectedStatuses: ["PENDING", "PROCESSING"],
        nextStatus: "COMPLETED",
        data: {
          providerRef,
          processedAt,
          failedAt: null,
          failureReason: null,
        },
      });
      await transitionWithdrawalTransaction(tx, {
        transactionId: withdrawal.transactionId,
        expectedStatuses: ["PENDING", "PROCESSING"],
        nextStatus: "COMPLETED",
      });

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_MARK_COMPLETED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: `Transferencia manual concluida. Operacao: ${providerRef}.`,
        receiptFile: {
          bytes: receipt.bytes,
          type: receipt.contentType,
          name: receipt.fileName,
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
        providerRef,
        email: withdrawal.user.email,
        name: withdrawal.user.name,
        industry: withdrawal.user.industry,
        pixKey: withdrawal.pixKey,
        pixKeyType: withdrawal.pixKeyType,
        processedAt,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    const emailResult = await sendWithdrawalPaidEmail({
      email: approved.email,
      name: approved.name,
      amount: approved.amount,
      pixKey: approved.pixKey,
      pixKeyType: approved.pixKeyType,
      providerRef: approved.providerRef,
      processedAt: approved.processedAt,
      receipt,
    });

    await db.withdrawalRequest
      .updateMany({
        where: { id: approved.id, status: "COMPLETED" },
        data: {
          receiptEmailAttempts: { increment: 1 },
          receiptEmailSentAt: emailResult.success ? new Date() : null,
          receiptEmailFailureReason: emailResult.success
            ? null
            : emailResult.error ||
              "Falha desconhecida ao enviar o comprovante.",
        },
      })
      .catch((error) => {
        console.error("[WITHDRAWAL_EMAIL_STATUS_UPDATE_ERROR]", error);
      });

    await upsertNotification({
      userId: approved.userId,
      actorId: admin.id,
      type: "SUCCESS",
      eventType: "WITHDRAWAL_COMPLETED",
      title: "Saque pago",
      message: `Seu saque foi pago. Identificacao da operacao: ${approved.providerRef}.`,
      link:
        approved.industry === "HEALTH"
          ? "/agendar-consulta/financeiro"
          : "/dashboard/financeiro",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: approved.id,
      metadata: {
        amount: approved.amount.toNumber(),
        providerRef: approved.providerRef,
        receiptEmailSent: emailResult.success,
      },
    }).catch((error) => {
      console.error("[WITHDRAWAL_COMPLETED_NOTIFICATION_ERROR]", error);
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");
    return { success: true, data: { emailSent: emailResult.success } };
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
