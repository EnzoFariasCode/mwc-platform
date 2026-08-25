"use server";

import { revalidatePath } from "next/cache";

import { consumeRateLimit } from "@/lib/action-rate-limit";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import {
  CHAT_REPORT_DESCRIPTION_MAX_LENGTH,
  CHAT_REPORT_DESCRIPTION_MIN_LENGTH,
  findChatBlockBetween,
  isChatReportReason,
  normalizeChatReportDescription,
  type ChatReportReasonValue,
} from "@/modules/chat/lib/chat-moderation";
import type { ActionResponse } from "@/modules/users/types/user-types";
import { enqueueAdminNotificationEmails } from "@/modules/email/services/admin-finance-email-service";

const CHAT_REPORT_LIMIT = 3;
const CHAT_REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

type ReportConversationInput = {
  conversationId: string;
  reportedUserId: string;
  reason: ChatReportReasonValue;
  description: string;
};

export async function reportConversation(
  input: ReportConversationInput,
): Promise<ActionResponse<{ reportId: string }>> {
  const session = await verifySession();
  const reporterId = session?.sub as string | undefined;

  if (!reporterId) return { success: false, error: "Nao autorizado." };

  if (session?.userType === "ADMIN" || session?.industry !== "TECH") {
    return {
      success: false,
      error: "Acao restrita aos participantes do Marketplace Tech.",
    };
  }

  const description = normalizeChatReportDescription(input.description);

  if (!input.conversationId || !input.reportedUserId) {
    return { success: false, error: "Conversa invalida." };
  }

  if (!isChatReportReason(input.reason)) {
    return { success: false, error: "Selecione um motivo valido." };
  }

  if (description.length < CHAT_REPORT_DESCRIPTION_MIN_LENGTH) {
    return {
      success: false,
      error: `Descreva o ocorrido com pelo menos ${CHAT_REPORT_DESCRIPTION_MIN_LENGTH} caracteres.`,
    };
  }

  if (description.length > CHAT_REPORT_DESCRIPTION_MAX_LENGTH) {
    return {
      success: false,
      error: `O relato deve ter no maximo ${CHAT_REPORT_DESCRIPTION_MAX_LENGTH} caracteres.`,
    };
  }

  const rateLimitError = await consumeRateLimit({
    key: `chat:report:user:${reporterId}`,
    limit: CHAT_REPORT_LIMIT,
    windowMs: CHAT_REPORT_WINDOW_MS,
    message: "Limite diario de denuncias atingido. Procure o suporte se houver risco imediato.",
  });

  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
      include: {
        participantA: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            userType: true,
            industry: true,
            isActive: true,
          },
        },
        participantB: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            userType: true,
            industry: true,
            isActive: true,
          },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversa nao encontrada." };
    }

    const isParticipantA = conversation.participantAId === reporterId;
    const isParticipantB = conversation.participantBId === reporterId;
    const reportedUser = isParticipantA
      ? conversation.participantB
      : conversation.participantA;
    const reporter = isParticipantA
      ? conversation.participantA
      : conversation.participantB;

    if (
      (!isParticipantA && !isParticipantB) ||
      reportedUser.id !== input.reportedUserId
    ) {
      return { success: false, error: "Voce nao participa desta conversa." };
    }

    const [existingOpenReport, existingBlock, sharedProjects] =
      await Promise.all([
        db.chatReport.findFirst({
          where: {
            conversationId: conversation.id,
            reporterId,
            reportedUserId: reportedUser.id,
            status: { in: ["OPEN", "UNDER_REVIEW"] },
          },
          select: { id: true },
        }),
        findChatBlockBetween(reporterId, reportedUser.id),
        db.project.findMany({
          where: {
            OR: [
              { ownerId: reporterId, professionalId: reportedUser.id },
              { ownerId: reportedUser.id, professionalId: reporterId },
              {
                ownerId: reporterId,
                proposals: { some: { professionalId: reportedUser.id } },
              },
              {
                ownerId: reportedUser.id,
                proposals: { some: { professionalId: reporterId } },
              },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            ownerId: true,
            professionalId: true,
            agreedPrice: true,
            updatedAt: true,
          },
        }),
      ]);

    if (existingOpenReport) {
      return {
        success: false,
        error: "Esta conversa ja possui uma denuncia sua em analise.",
      };
    }

    if (existingBlock) {
      return {
        success: false,
        error: "A comunicacao entre estas contas ja esta bloqueada.",
      };
    }

    const now = new Date();
    const isPriority = sharedProjects.some((project) =>
      ["WAITING_PAYMENT", "IN_PROGRESS", "UNDER_REVIEW", "DISPUTE"].includes(
        project.status,
      ),
    );
    const report = await db.$transaction(async (tx) => {
      const created = await tx.chatReport.create({
        data: {
          conversationId: conversation.id,
          reporterId,
          reportedUserId: reportedUser.id,
          reason: input.reason,
          description,
          reportedThroughAt: now,
          isPriority,
          contextSnapshot: {
            reporter: {
              id: reporter.id,
              name: reporter.name,
              displayName: reporter.displayName,
              email: reporter.email,
              userType: reporter.userType,
              industry: reporter.industry,
              isActive: reporter.isActive,
            },
            reportedUser: {
              id: reportedUser.id,
              name: reportedUser.name,
              displayName: reportedUser.displayName,
              email: reportedUser.email,
              userType: reportedUser.userType,
              industry: reportedUser.industry,
              isActive: reportedUser.isActive,
            },
            projects: sharedProjects.map((project) => ({
              ...project,
              agreedPrice: project.agreedPrice?.toString() ?? null,
              updatedAt: project.updatedAt.toISOString(),
            })),
          },
        },
        select: { id: true },
      });

      await tx.userBlock.create({
        data: {
          blockerId: reporterId,
          blockedUserId: reportedUser.id,
          conversationId: conversation.id,
          sourceReportId: created.id,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          deletedByIds: Array.from(
            new Set([
              ...conversation.deletedByIds,
              reporterId,
              reportedUser.id,
            ]),
          ),
        },
      });

      const title = isPriority
        ? "Denuncia prioritaria no chat"
        : "Nova denuncia no chat";
      const summary = `${reporter.displayName || reporter.name} denunciou ${reportedUser.displayName || reportedUser.name}.`;
      await enqueueAdminNotificationEmails(tx, {
        eventType: "CHAT_REPORT_CREATED",
        entityType: "CHAT_REPORT",
        entityId: created.id,
        templateKey: "admin.report.created",
        roles: ["OWNER", "SUPPORT"],
        title,
        summary,
        lines: [
          summary,
          "A conversa foi preservada para auditoria e a comunicacao entre as contas foi bloqueada.",
          "Consulte o painel para ler o relato e o contexto completo.",
        ],
        details: [
          { label: "Motivo", value: input.reason },
          { label: "Prioridade", value: isPriority ? "Alta" : "Normal" },
        ],
        actionPath: `/dashboard/admin/denuncias/${created.id}`,
        actionLabel: "Analisar denuncia",
        actorId: reporterId,
        priority: isPriority ? 10 : 20,
        notification: {
          type: isPriority ? "WARNING" : "INFO",
          title,
          message: summary,
          metadata: { conversationId: conversation.id, isPriority },
        },
      });

      return created;
    });

    revalidatePath("/dashboard/chat");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/denuncias");

    return { success: true, data: { reportId: report.id } };
  } catch (error) {
    console.error("[CHAT_REPORT_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel registrar a denuncia. Tente novamente.",
    };
  }
}
