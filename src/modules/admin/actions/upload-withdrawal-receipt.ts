"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";
import { consumeRateLimit } from "@/lib/action-rate-limit";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_UPLOAD_LIMIT = 10;
const RECEIPT_UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadWithdrawalReceipt(
  formData: FormData,
): Promise<ActionResponse> {
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

  const auditLogId = formData.get("auditLogId")?.toString();
  const file = formData.get("receipt");

  if (!auditLogId) {
    return { success: false, error: "Registro de auditoria invalido." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione um comprovante para anexar." };
  }

  if (file.size > MAX_RECEIPT_BYTES) {
    return {
      success: false,
      error: "O comprovante deve ter no maximo 5 MB.",
    };
  }

  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Envie um PDF, JPG, PNG ou WEBP.",
    };
  }

  try {
    const auditLogs = await db.$queryRaw<
      Array<{ id: string; entityType: string; entityId: string }>
    >`
      SELECT "id", "entityType", "entityId"
      FROM "AdminAuditLog"
      WHERE "id" = ${auditLogId}
      LIMIT 1
    `;
    const auditLog = auditLogs[0];

    if (!auditLog) {
      return { success: false, error: "Registro de auditoria nao encontrado." };
    }

    if (auditLog.entityType !== "WITHDRAWAL_REQUEST") {
      return {
        success: false,
        error: "Comprovante PIX permitido apenas para saques.",
      };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const receiptUrl = `/api/admin/audit-receipts/${auditLog.id}`;

    await db.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "AdminAuditLog"
        SET
          "receiptUrl" = ${receiptUrl},
          "receiptFileBytes" = ${bytes},
          "receiptFileType" = ${file.type},
          "receiptFileName" = ${file.name}
        WHERE "id" = ${auditLog.id}
      `;

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "PIX_WITHDRAWAL_RECEIPT_ATTACHED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: auditLog.entityId,
        reason: "Comprovante PIX anexado pela tesouraria.",
        receiptUrl,
        metadata: {
          originalAuditLogId: auditLog.id,
          receiptFileName: file.name,
          receiptFileType: file.type,
          receiptFileSize: file.size,
        },
      });
    });

    revalidatePath("/dashboard/admin/financeiro");
    revalidatePath(`/dashboard/admin/disputas`);

    return { success: true };
  } catch (error) {
    console.error("[UPLOAD_WITHDRAWAL_RECEIPT_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel anexar o comprovante.",
    };
  }
}
