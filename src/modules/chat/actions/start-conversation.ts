"use server";

import { revalidatePath } from "next/cache";

import { verifySession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { ActionResponse } from "@/modules/users/types/user-types";

const CHAT_NEW_CONVERSATION_LIMIT = 5;
const CHAT_NEW_CONVERSATION_WINDOW_MS = 60 * 60 * 1000;

type StartedConversation = {
  conversationId: string;
  otherUserId: string;
};

async function hasSharedTechContext(starterId: string, receiverId: string) {
  const project = await db.project.findFirst({
    where: {
      OR: [
        { ownerId: starterId, professionalId: receiverId },
        { ownerId: receiverId, professionalId: starterId },
        {
          ownerId: starterId,
          proposals: { some: { professionalId: receiverId } },
        },
        {
          ownerId: receiverId,
          proposals: { some: { professionalId: starterId } },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

export async function startConversation(
  receiverId: string,
): Promise<ActionResponse<StartedConversation>> {
  try {
    const session = await verifySession();
    const starterId = session?.sub as string | undefined;

    if (!starterId) return { success: false, error: "Nao autorizado." };

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Acao restrita ao Marketplace Tech.",
      };
    }

    if (!receiverId || receiverId === starterId) {
      return { success: false, error: "Destinatario invalido." };
    }

    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        name: true,
        displayName: true,
        userType: true,
        industry: true,
        isActive: true,
      },
    });

    if (!receiver || !receiver.isActive || receiver.industry !== "TECH") {
      return {
        success: false,
        error: "Usuario de Tecnologia nao encontrado.",
      };
    }

    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: starterId, participantBId: receiverId },
          { participantAId: receiverId, participantBId: starterId },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      const receiverIsPublicTechProfessional =
        receiver.userType === "PROFESSIONAL" && receiver.industry === "TECH";
      const hasSharedContext = await hasSharedTechContext(starterId, receiverId);

      if (!receiverIsPublicTechProfessional && !hasSharedContext) {
        return {
          success: false,
          error:
            "Conversa permitida apenas com profissional Tech ou usuarios com projeto/proposta em comum.",
        };
      }

      const newConversationLimitError = await consumeRateLimit({
        key: `chat:new-conversation:user:${starterId}`,
        limit: CHAT_NEW_CONVERSATION_LIMIT,
        windowMs: CHAT_NEW_CONVERSATION_WINDOW_MS,
        message: "Voce iniciou muitas conversas em pouco tempo.",
      });

      if (newConversationLimitError) {
        return { success: false, error: newConversationLimitError };
      }

      const starter = await db.user.findUnique({
        where: { id: starterId },
        select: { name: true, displayName: true, userType: true },
      });
      const starterName =
        starter?.displayName || starter?.name || "Um cliente";
      const receiverName =
        receiver.displayName || receiver.name || "profissional";

      conversation = await db.conversation.create({
        data: {
          participantAId: starterId,
          participantBId: receiverId,
          lastMessage: `${starterName} iniciou uma conversa com ${receiverName}.`,
          lastMessageTime: new Date(),
          unreadCountA: 0,
          unreadCountB: 0,
          deletedByIds: [],
        },
        select: { id: true },
      });

      if (receiver.userType === "PROFESSIONAL" && starter?.userType === "CLIENT") {
        await upsertNotification({
          userId: receiverId,
          actorId: starterId,
          type: "MESSAGE",
          eventType: "CHAT_STARTED",
          title: "Nova conversa",
          message: `${starterName} abriu uma conversa com voce no chat.`,
          link: `/dashboard/chat?newChat=${starterId}`,
          entityType: "CONVERSATION",
          entityId: conversation.id,
          metadata: {
            starterId,
            receiverId,
          },
        });
      }
    }

    revalidatePath("/dashboard/chat");

    return {
      success: true,
      data: {
        conversationId: conversation.id,
        otherUserId: receiverId,
      },
    };
  } catch (error) {
    console.error("Erro ao iniciar conversa:", error);
    return { success: false, error: "Erro ao iniciar conversa." };
  }
}
