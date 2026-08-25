"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { ActionResponse } from "@/modules/users/types/user-types";
import { enqueueWithdrawalPaidEmail } from "@/modules/email/services/admin-finance-email-service";

const RECEIPT_EMAIL_LIMIT = 10;
const RECEIPT_EMAIL_WINDOW_MS = 10 * 60 * 1000;

export async function resendWithdrawalReceiptEmail(
  withdrawalId: string,
): Promise<ActionResponse> {
  const admin = await requireAdminRole(["OWNER", "FINANCE"]);

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  const rateLimitError = await consumeRateLimit({
    key: `admin:withdrawal-receipt-email:user:${admin.id}`,
    limit: RECEIPT_EMAIL_LIMIT,
    windowMs: RECEIPT_EMAIL_WINDOW_MS,
    message: "Muitos reenvios em sequencia. Aguarde alguns minutos.",
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      select: {
        id: true,
        status: true,
        amount: true,
        pixKey: true,
        pixKeyType: true,
        providerRef: true,
        processedAt: true,
        userId: true,
        user: { select: { email: true, name: true, industry: true } },
      },
    });

    if (
      !withdrawal ||
      withdrawal.status !== "COMPLETED" ||
      !withdrawal.providerRef ||
      !withdrawal.processedAt
    ) {
      return {
        success: false,
        error: "Somente saques pagos podem ter o comprovante reenviado.",
      };
    }

    const receipts = await db.$queryRaw<
      Array<{
        id: string;
      }>
    >`
      SELECT "id"
      FROM "AdminAuditLog"
      WHERE "entityType" = 'WITHDRAWAL_REQUEST'
        AND "entityId" = ${withdrawal.id}
        AND "receiptFileBytes" IS NOT NULL
        AND "receiptFileType" IS NOT NULL
        AND "receiptFileName" IS NOT NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const storedReceipt = receipts[0];

    if (!storedReceipt) {
      return {
        success: false,
        error: "Nenhum comprovante esta armazenado para este saque.",
      };
    }

    const attemptedAt = new Date();

    await db.$transaction(async (tx) => {
      const retryAudit = await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_RECEIPT_EMAIL_RETRIED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: "Reenvio do comprovante PIX registrado na outbox.",
        metadata: {
          emailQueued: true,
          attemptedAt: attemptedAt.toISOString(),
          sourceReceiptAuditLogId: storedReceipt.id,
        },
      });
      const actionPath =
        withdrawal.user.industry === "HEALTH"
          ? "/agendar-consulta/financeiro"
          : "/dashboard/financeiro";
      await enqueueWithdrawalPaidEmail(tx, {
        idempotencyKey: `FINANCE_WITHDRAWAL_RECEIPT_RESEND:${retryAudit.id}:${withdrawal.userId}`,
        eventType: "FINANCE_WITHDRAWAL_RECEIPT_RESENT",
        withdrawalId: withdrawal.id,
        recipient: {
          id: withdrawal.userId,
          email: withdrawal.user.email,
          name: withdrawal.user.name,
        },
        amount: withdrawal.amount.toNumber().toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        pixKey: withdrawal.pixKey,
        pixKeyType: withdrawal.pixKeyType,
        providerRef: withdrawal.providerRef!,
        processedAt: withdrawal.processedAt!.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        }),
        receiptAuditLogId: storedReceipt.id,
        actionPath,
      });
      await upsertNotification({
        userId: withdrawal.userId,
        actorId: admin.id,
        type: "INFO",
        eventType: "WITHDRAWAL_RECEIPT_EMAIL_RESENT",
        title: "Reenvio do comprovante",
        message: "O reenvio do comprovante do seu saque PIX foi registrado.",
        link: actionPath,
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        metadata: { queuedAt: attemptedAt.toISOString() },
      }, tx);
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    return { success: true };
  } catch (error) {
    console.error("[RESEND_WITHDRAWAL_RECEIPT_EMAIL_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel reenviar o comprovante.",
    };
  }
}
