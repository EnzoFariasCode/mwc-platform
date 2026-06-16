"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadWithdrawalReceipt(
  formData: FormData,
): Promise<ActionResponse> {
  await requireAdminUser();

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

    await db.$executeRaw`
      UPDATE "AdminAuditLog"
      SET
        "receiptUrl" = ${receiptUrl},
        "receiptFileBytes" = ${bytes},
        "receiptFileType" = ${file.type},
        "receiptFileName" = ${file.name}
      WHERE "id" = ${auditLog.id}
    `;

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
