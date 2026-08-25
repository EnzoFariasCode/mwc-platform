"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { validateAdminDecisionReason } from "@/modules/admin/lib/admin-decision-reason";
import { enqueueAdminFinanceEmail } from "@/modules/email/services/admin-finance-email-service";
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
}): Promise<ActionResponse<{ emailQueued: boolean }>> {
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
          decisionNotifiedAt: null,
          decisionEmailError: null,
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

      const reporterLines =
        decision === "WARNING"
          ? [
              "Sua denuncia no Marketplace Tech foi analisada e uma advertencia foi emitida.",
              `Conclusao administrativa: ${reasonResult.value}`,
              "A comunicacao entre as contas permanece bloqueada.",
            ]
          : [
              "Sua denuncia foi analisada e encerrada sem penalidade administrativa.",
              `Conclusao administrativa: ${reasonResult.value}`,
              "Por seguranca, o bloqueio de comunicacao permanece ativo.",
            ];
      const reportedUserLines =
        decision === "WARNING"
          ? [
              "A equipe administrativa analisou uma denuncia relacionada a uma conversa e emitiu uma advertencia de conduta.",
              `Justificativa: ${reasonResult.value}`,
              "A comunicacao entre as contas permanece bloqueada.",
            ]
          : [
              "Uma denuncia relacionada a uma conversa foi encerrada sem penalidade administrativa para sua conta.",
              `Conclusao administrativa: ${reasonResult.value}`,
              "O bloqueio de comunicacao permanece ativo.",
            ];

      await enqueueAdminFinanceEmail(tx, {
        idempotencyKey: `ADMIN_CHAT_REPORT_DECISION:${reportId}:REPORTER:${report.reporter.id}`,
        eventType: "ADMIN_CHAT_REPORT_DECISION_REPORTER",
        templateKey: "admin.report.decision",
        recipient: report.reporter,
        entityType: "CHAT_REPORT",
        entityId: reportId,
        content: {
          title: "Denuncia analisada",
          preview: "A analise administrativa da sua denuncia foi concluida.",
          lines: reporterLines,
          actionLabel: "Abrir conversas",
          actionPath: "/dashboard/chat",
        },
      });
      await enqueueAdminFinanceEmail(tx, {
        idempotencyKey: `ADMIN_CHAT_REPORT_DECISION:${reportId}:REPORTED_USER:${report.reportedUser.id}`,
        eventType: "ADMIN_CHAT_REPORT_DECISION_REPORTED_USER",
        templateKey: "admin.report.decision",
        recipient: report.reportedUser,
        entityType: "CHAT_REPORT",
        entityId: reportId,
        content: {
          title:
            decision === "WARNING"
              ? "Advertencia de conduta"
              : "Analise administrativa encerrada",
          preview: "A analise administrativa de uma denuncia foi concluida.",
          lines: reportedUserLines,
          actionLabel: "Abrir conversas",
          actionPath: "/dashboard/chat",
        },
      });

      return true;
    });

    if (!changed) {
      return {
        success: false,
        error: "A denuncia foi alterada por outra operacao. Atualize a pagina.",
      };
    }

    revalidatePath(`/dashboard/admin/denuncias/${reportId}`);
    revalidatePath("/dashboard/admin/denuncias");
    revalidatePath("/dashboard/admin");
    return { success: true, data: { emailQueued: true } };
  } catch (error) {
    console.error("[CHAT_REPORT_RESOLUTION_ERROR]", error);
    return { success: false, error: "Nao foi possivel concluir a analise." };
  }
}

export async function retryChatReportDecisionEmails(
  reportId: string,
): Promise<ActionResponse<{ emailQueued: boolean }>> {
  const admin = await requireAdminUser();

  if (!reportId) return { success: false, error: "Denuncia invalida." };

  try {
    const report = await db.chatReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        resolution: true,
        resolutionReason: true,
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report?.resolution || !report.resolutionReason) {
      return {
        success: false,
        error: "A denuncia ainda nao possui uma decisao concluida.",
      };
    }

    await db.$transaction(async (tx) => {
      const retryAudit = await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "CHAT_REPORT_EMAIL_RETRY",
        entityType: "CHAT_REPORT",
        entityId: reportId,
        reason: "Reenvio da decisao registrado na outbox.",
        metadata: { emailQueued: true },
      });
      const decision = report.resolution!;
      const reason = report.resolutionReason!;
      for (const party of [
        { role: "REPORTER", recipient: report.reporter },
        { role: "REPORTED_USER", recipient: report.reportedUser },
      ] as const) {
        await enqueueAdminFinanceEmail(tx, {
          idempotencyKey: `ADMIN_CHAT_REPORT_DECISION_RETRY:${retryAudit.id}:${party.role}:${party.recipient.id}`,
          eventType: `ADMIN_CHAT_REPORT_DECISION_RETRY_${party.role}`,
          templateKey: "admin.report.decision",
          recipient: party.recipient,
          entityType: "CHAT_REPORT",
          entityId: reportId,
          content: {
            title:
              decision === "WARNING"
                ? party.role === "REPORTER"
                  ? "Denuncia analisada"
                  : "Advertencia de conduta"
                : "Analise administrativa encerrada",
            preview: "A decisao administrativa esta disponivel.",
            lines: [
              decision === "WARNING"
                ? "A denuncia foi concluida com emissao de advertencia."
                : "A denuncia foi encerrada sem penalidade administrativa.",
              `Conclusao administrativa: ${reason}`,
              "O bloqueio de comunicacao permanece ativo.",
            ],
            actionLabel: "Abrir conversas",
            actionPath: "/dashboard/chat",
          },
        });
      }
    });

    revalidatePath(`/dashboard/admin/denuncias/${reportId}`);
    return { success: true, data: { emailQueued: true } };
  } catch (error) {
    console.error("[CHAT_REPORT_EMAIL_RETRY_ERROR]", error);
    return { success: false, error: "Nao foi possivel reenviar os e-mails." };
  }
}
