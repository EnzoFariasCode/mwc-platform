"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { retryAppointmentRescheduleReconciliation } from "@/modules/health/services/appointment-reschedule-recovery";

export async function retryRescheduleReconciliation(processId: string) {
  const admin = await requireAdminRole(["OWNER", "FINANCE", "SUPPORT"]);

  if (!processId) return { success: false, error: "Processo invalido." };

  try {
    const result = await retryAppointmentRescheduleReconciliation(processId);

    await db.$transaction((tx) =>
      createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "HEALTH_RESCHEDULE_RETRY",
        entityType: "APPOINTMENT_RESCHEDULE",
        entityId: processId,
        reason: "Retry manual da reconciliacao de reagendamento.",
        metadata: { resultStatus: result.status },
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
          : "Nao foi possivel retomar o reagendamento.",
    };
  }
}
