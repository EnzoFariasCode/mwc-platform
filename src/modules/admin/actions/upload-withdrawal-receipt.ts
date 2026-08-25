"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { validateWithdrawalReceipt } from "@/modules/admin/lib/withdrawal-receipt";
import { enqueueWithdrawalPaidEmail } from "@/modules/email/services/admin-finance-email-service";

const RECEIPT_UPLOAD_LIMIT = 10;
const RECEIPT_UPLOAD_WINDOW_MS = 10 * 60 * 1000;

export async function uploadWithdrawalReceipt(
  formData: FormData,
): Promise<ActionResponse<{ emailQueued: boolean }>> {
  const admin = await requireAdminRole(["OWNER", "FINANCE"]);

  const rateLimitError = await consumeRateLimit({
    key: `admin:receipt-upload:user:${admin.id}`,
    limit: RECEIPT_UPLOAD_LIMIT,
    windowMs: RECEIPT_UPLOAD_WINDOW_MS,
    message: "Muitos uploads de comprovante. Tente novamente em instantes.",
  });

  if (rateLimitError) {
    return { success: false, error: rateLimitError };
  }

  const withdrawalId = formData.get("withdrawalId")?.toString();

  if (!withdrawalId) {
    return { success: false, error: "Solicitacao de saque invalida." };
  }

  const receiptResult = await validateWithdrawalReceipt(
    formData.get("receipt"),
  );
  if (!receiptResult.success) return receiptResult;

  try {
    const receipt = receiptResult.receipt;
    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      select: {
        id: true,
        status: true,
        userId: true,
        amount: true,
        pixKey: true,
        pixKeyType: true,
        providerRef: true,
        processedAt: true,
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
        error: "O comprovante so pode ser anexado a um saque pago.",
      };
    }

    await db.$transaction(async (tx) => {
      const receiptAudit = await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_RECEIPT_ATTACHED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        reason: "Comprovante PIX anexado pela tesouraria.",
        receiptFile: {
          bytes: receipt.bytes,
          type: receipt.contentType,
          name: receipt.fileName,
        },
        metadata: {
          receiptFileName: receipt.fileName,
          receiptFileType: receipt.contentType,
          receiptFileSize: receipt.bytes.length,
        },
      });
      const actionPath =
        withdrawal.user.industry === "HEALTH"
          ? "/agendar-consulta/financeiro"
          : "/dashboard/financeiro";
      await enqueueWithdrawalPaidEmail(tx, {
        idempotencyKey: `FINANCE_WITHDRAWAL_RECEIPT_ATTACHED:${receiptAudit.id}:${withdrawal.userId}`,
        eventType: "FINANCE_WITHDRAWAL_RECEIPT_ATTACHED",
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
        receiptAuditLogId: receiptAudit.id,
        actionPath,
      });
      await upsertNotification({
        userId: withdrawal.userId,
        actorId: admin.id,
        type: "SUCCESS",
        eventType: "WITHDRAWAL_RECEIPT_ATTACHED",
        title: "Comprovante do saque",
        message:
          "A tesouraria anexou o comprovante do seu saque PIX e registrou o envio por e-mail.",
        link: actionPath,
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        metadata: {
          receiptFileName: receipt.fileName,
          emailQueued: true,
        },
      }, tx);
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    return { success: true, data: { emailQueued: true } };
  } catch (error) {
    console.error("[UPLOAD_WITHDRAWAL_RECEIPT_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel anexar o comprovante.",
    };
  }
}
