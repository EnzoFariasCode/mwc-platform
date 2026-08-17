"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import {
  registerManualAppointmentMeetingLink,
  retryAppointmentMeetingAdministratively,
} from "@/modules/health/services/appointment-meeting-recovery";

function revalidateMeetingPaths() {
  revalidatePath("/dashboard/admin/reconciliacoes");
  revalidatePath("/dashboard/admin");
  revalidatePath("/agendar-consulta/historico");
  revalidatePath("/agendar-consulta/dashboard-profissional");
}

export async function retryMeetingReconciliation(appointmentId: string) {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);
  if (!appointmentId) return { success: false, error: "Consulta invalida." };

  try {
    const result =
      await retryAppointmentMeetingAdministratively(appointmentId);

    await db.$transaction((tx) =>
      createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "HEALTH_MEETING_ADMIN_RETRY",
        entityType: "HEALTH_APPOINTMENT",
        entityId: appointmentId,
        reason: "Nova tentativa administrativa de criacao da sala online.",
        metadata: { resultStatus: result.status },
      }),
    );

    revalidateMeetingPaths();
    return {
      success: true,
      confirmed: result.status === "CONFIRMED",
      requiresAttention: result.status === "REQUIRES_ATTENTION",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel tentar novamente.",
    };
  }
}

export async function registerManualMeetingLink(
  appointmentId: string,
  meetLink: string,
) {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);
  if (!appointmentId) return { success: false, error: "Consulta invalida." };

  try {
    await registerManualAppointmentMeetingLink(appointmentId, meetLink);

    await db.$transaction((tx) =>
      createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "HEALTH_MEETING_MANUAL_LINK",
        entityType: "HEALTH_APPOINTMENT",
        entityId: appointmentId,
        reason: "Link do Google Meet cadastrado manualmente.",
      }),
    );

    revalidateMeetingPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel cadastrar o link.",
    };
  }
}
