"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { validateWithdrawalReceipt } from "@/modules/admin/lib/withdrawal-receipt";
import { sendWithdrawalPaidEmail } from "@/modules/finance/services/withdrawal-email-service";

const RECEIPT_UPLOAD_LIMIT = 10;
const RECEIPT_UPLOAD_WINDOW_MS = 10 * 60 * 1000;

export async function uploadWithdrawalReceipt(
  formData: FormData,
): Promise<ActionResponse<{ emailSent: boolean }>> {
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
      return createAdminAuditLog(tx, {
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
    });

    const emailResult = await sendWithdrawalPaidEmail({
      email: withdrawal.user.email,
      name: withdrawal.user.name,
      amount: withdrawal.amount,
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType,
      providerRef: withdrawal.providerRef,
      processedAt: withdrawal.processedAt,
      receipt,
    });

    await db.withdrawalRequest
      .updateMany({
        where: { id: withdrawal.id, status: "COMPLETED" },
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
      userId: withdrawal.userId,
      actorId: admin.id,
      type: "SUCCESS",
      eventType: "WITHDRAWAL_RECEIPT_ATTACHED",
      title: "Comprovante do saque",
      message: emailResult.success
        ? "A tesouraria enviou o comprovante do seu saque PIX por e-mail."
        : "A tesouraria anexou o comprovante do seu saque PIX.",
      link:
        withdrawal.user.industry === "HEALTH"
          ? "/agendar-consulta/financeiro"
          : "/dashboard/financeiro",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: withdrawal.id,
      metadata: {
        receiptFileName: receipt.fileName,
        emailSent: emailResult.success,
      },
    }).catch((error) => {
      console.error("[WITHDRAWAL_RECEIPT_NOTIFICATION_ERROR]", error);
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath("/agendar-consulta/financeiro");

    return { success: true, data: { emailSent: emailResult.success } };
  } catch (error) {
    console.error("[UPLOAD_WITHDRAWAL_RECEIPT_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel anexar o comprovante.",
    };
  }
}
