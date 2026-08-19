"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { validateAdminDecisionReason } from "@/modules/admin/lib/admin-decision-reason";
import { sendChatReportDecisionEmails } from "@/modules/admin/services/chat-report-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { ActionResponse } from "@/modules/users/types/user-types";

export async function startChatReportReview(
  reportId: string,
): Promise<ActionResponse> {
  const admin = await requireAdminUser();

  if (!reportId) return { success: false, error: "Denuncia invalida." };

  try {
    const changed = await db.$transaction(async (tx) => {
      const updated = await tx.chatReport.updateMany({
        where: { id: reportId, status: "OPEN" },
        data: {
          status: "UNDER_REVIEW",
          reviewerId: admin.id,
          reviewedAt: new Date(),
        },
      });

      if (updated.count !== 1) return false;

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "CHAT_REPORT_REVIEW_STARTED",
        entityType: "CHAT_REPORT",
        entityId: reportId,
        reason: "Analise administrativa iniciada.",
      });

      return true;
    });

    if (!changed) {
      return {
        success: false,
        error: "A denuncia ja foi assumida ou encerrada. Atualize a pagina.",
      };
    }

    revalidatePath(`/dashboard/admin/denuncias/${reportId}`);
    revalidatePath("/dashboard/admin/denuncias");
    return { success: true };
  } catch (error) {
    console.error("[CHAT_REPORT_REVIEW_START_ERROR]", error);
    return { success: false, error: "Nao foi possivel iniciar a analise." };
  }
}

export async function resolveChatReport({
  reportId,
  decision,
  reason: rawReason,
}: {
  reportId: string;
  decision: "WARNING" | "NO_PENALTY";
  reason: string;
}): Promise<ActionResponse<{ emailDelivered: boolean }>> {
  const admin = await requireAdminUser();
  const reasonResult = validateAdminDecisionReason(rawReason);

  if (!reportId) return { success: false, error: "Denuncia invalida." };
  if (!reasonResult.success) return reasonResult;
  if (!(["WARNING", "NO_PENALTY"] as const).includes(decision)) {
    return { success: false, error: "Decisao invalida." };
  }

  try {
    const report = await db.chatReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report) return { success: false, error: "Denuncia nao encontrada." };
    if (!["OPEN", "UNDER_REVIEW"].includes(report.status)) {
      return { success: false, error: "Esta denuncia ja foi encerrada." };
    }

    const nextStatus = decision === "WARNING" ? "RESOLVED" : "DISMISSED";
    const now = new Date();
    const changed = await db.$transaction(async (tx) => {
      const updated = await tx.chatReport.updateMany({
        where: { id: reportId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
        data: {
          status: nextStatus,
          resolution: decision,
          resolutionReason: reasonResult.value,
          reviewerId: admin.id,
          reviewedAt: report.status === "OPEN" ? now : undefined,
          resolvedAt: now,
        },
      });

      if (updated.count !== 1) return false;

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action:
          decision === "WARNING"
            ? "CHAT_REPORT_WARNING_ISSUED"
            : "CHAT_REPORT_CLOSED_WITHOUT_PENALTY",
        entityType: "CHAT_REPORT",
        entityId: reportId,
        reason: reasonResult.value,
        metadata: {
          reporterId: report.reporter.id,
          reportedUserId: report.reportedUser.id,
          previousStatus: report.status,
          nextStatus,
          communicationBlockPreserved: true,
        },
      });

      await Promise.all([
        upsertNotification(
          {
            userId: report.reporter.id,
            actorId: admin.id,
            type: decision === "WARNING" ? "SUCCESS" : "INFO",
            eventType: `CHAT_REPORT_${decision}_REPORTER`,
            title: "Denuncia analisada",
            message:
              decision === "WARNING"
                ? "A analise foi concluida e uma advertencia foi emitida."
                : "A analise foi encerrada sem penalidade administrativa.",
            link: "/dashboard/chat",
            entityType: "CHAT_REPORT",
            entityId: reportId,
          },
          tx,
        ),
        upsertNotification(
          {
            userId: report.reportedUser.id,
            actorId: admin.id,
            type: decision === "WARNING" ? "WARNING" : "INFO",
            eventType: `CHAT_REPORT_${decision}_REPORTED_USER`,
            title:
              decision === "WARNING"
                ? "Advertencia de conduta"
                : "Analise administrativa encerrada",
            message: reasonResult.value,
            link: "/dashboard/chat",
            entityType: "CHAT_REPORT",
            entityId: reportId,
          },
          tx,
        ),
      ]);

      return true;
    });

    if (!changed) {
      return {
        success: false,
        error: "A denuncia foi alterada por outra operacao. Atualize a pagina.",
      };
    }

    const emailResults = await sendChatReportDecisionEmails({
      reportId,
      decision,
      reason: reasonResult.value,
      reporter: {
        name: report.reporter.name || "usuario",
        email: report.reporter.email,
      },
      reportedUser: {
        name: report.reportedUser.name || "usuario",
        email: report.reportedUser.email,
      },
    });
    const emailDelivered = emailResults.every((result) => result.success);

    await db.chatReport.update({
      where: { id: reportId },
      data: {
        decisionNotifiedAt: emailDelivered ? new Date() : null,
        decisionEmailError: emailDelivered
          ? null
          : emailResults
              .filter((result) => !result.success)
              .map((result) => result.error || "Falha nao identificada.")
              .join(" "),
      },
    });

    revalidatePath(`/dashboard/admin/denuncias/${reportId}`);
    revalidatePath("/dashboard/admin/denuncias");
    revalidatePath("/dashboard/admin");
    return { success: true, data: { emailDelivered } };
  } catch (error) {
    console.error("[CHAT_REPORT_RESOLUTION_ERROR]", error);
    return { success: false, error: "Nao foi possivel concluir a analise." };
  }
}

export async function retryChatReportDecisionEmails(
  reportId: string,
): Promise<ActionResponse<{ emailDelivered: boolean }>> {
  const admin = await requireAdminUser();

  if (!reportId) return { success: false, error: "Denuncia invalida." };

  try {
    const report = await db.chatReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        resolution: true,
        resolutionReason: true,
        reporter: { select: { name: true, email: true } },
        reportedUser: { select: { name: true, email: true } },
      },
    });

    if (!report?.resolution || !report.resolutionReason) {
      return {
        success: false,
        error: "A denuncia ainda nao possui uma decisao concluida.",
      };
    }

    const results = await sendChatReportDecisionEmails({
      reportId,
      decision: report.resolution,
      reason: report.resolutionReason,
      reporter: {
        name: report.reporter.name || "usuario",
        email: report.reporter.email,
      },
      reportedUser: {
        name: report.reportedUser.name || "usuario",
        email: report.reportedUser.email,
      },
    });
    const emailDelivered = results.every((result) => result.success);

    const emailError = emailDelivered
      ? null
      : results
          .filter((result) => !result.success)
          .map((result) => result.error || "Falha nao identificada.")
          .join(" ");

    await db.$transaction(async (tx) => {
      await tx.chatReport.update({
        where: { id: reportId },
        data: {
          decisionNotifiedAt: emailDelivered ? new Date() : null,
          decisionEmailError: emailError,
        },
      });
      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "CHAT_REPORT_EMAIL_RETRY",
        entityType: "CHAT_REPORT",
        entityId: reportId,
        reason: emailDelivered
          ? "E-mails da decisao reenviados com sucesso."
          : "Nova tentativa de e-mail nao foi confirmada pelo provedor.",
        metadata: { emailDelivered, emailError },
      });
    });

    revalidatePath(`/dashboard/admin/denuncias/${reportId}`);
    return { success: true, data: { emailDelivered } };
  } catch (error) {
    console.error("[CHAT_REPORT_EMAIL_RETRY_ERROR]", error);
    return { success: false, error: "Nao foi possivel reenviar os e-mails." };
  }
}
