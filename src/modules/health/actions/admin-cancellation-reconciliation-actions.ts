"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import {
  attachCancellationRefundAndRetry,
  confirmCancellationMeetResolved,
  retryAppointmentCancellationReconciliation,
} from "@/modules/health/services/appointment-cancellation-recovery";

type ReconciliationAction = "RETRY" | "MEET_RESOLVED" | "REFUND_ATTACHED";

async function runReconciliationAction({
  processId,
  action,
  refundId,
}: {
  processId: string;
  action: ReconciliationAction;
  refundId?: string;
}) {
  const admin = await requireAdminRole(
    action === "REFUND_ATTACHED"
      ? ["OWNER", "FINANCE"]
      : ["OWNER", "FINANCE", "SUPPORT"],
  );

  if (!processId) return { success: false, error: "Processo invalido." };

  try {
    const result =
      action === "MEET_RESOLVED"
        ? await confirmCancellationMeetResolved(processId)
        : action === "REFUND_ATTACHED"
          ? await attachCancellationRefundAndRetry(processId, refundId || "")
          : await retryAppointmentCancellationReconciliation(processId);

    await db.$transaction((tx) =>
      createAdminAuditLog(tx, {
        actorId: admin.id,
        action: `HEALTH_CANCELLATION_${action}`,
        entityType: "APPOINTMENT_CANCELLATION",
        entityId: processId,
        reason: "Intervencao manual na reconciliacao de cancelamento.",
        metadata: { resultStatus: result.status, refundId: refundId || null },
      }),
    );

    revalidatePath("/dashboard/admin/reconciliacoes");
    revalidatePath("/dashboard/admin");
    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    return { success: true, processing: result.status !== "COMPLETED" };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel retomar o cancelamento.",
    };
  }
}

export async function retryCancellationReconciliation(processId: string) {
  return runReconciliationAction({ processId, action: "RETRY" });
}

export async function confirmMeetCancellationManually(processId: string) {
  return runReconciliationAction({ processId, action: "MEET_RESOLVED" });
}

export async function registerCancellationRefund(
  processId: string,
  refundId: string,
) {
  if (!refundId.trim().startsWith("re_")) {
    return { success: false, error: "Informe um ID de reembolso Stripe valido." };
  }

  return runReconciliationAction({
    processId,
    action: "REFUND_ATTACHED",
    refundId: refundId.trim(),
  });
}
