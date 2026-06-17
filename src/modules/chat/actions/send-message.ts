"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import {
  CHAT_MAX_CONTENT_LENGTH,
  canSendExternalContact,
  containsExternalContact,
  isBroadcastDuplicateLimitReached,
  isMessageTooLong,
  normalizeMessageContent,
} from "@/modules/chat/lib/chat-safety";

const CHAT_USER_LIMIT = 30;
const CHAT_PAIR_LIMIT = 12;
const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_NEW_CONVERSATION_LIMIT = 5;
const CHAT_NEW_CONVERSATION_WINDOW_MS = 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const BROADCAST_WINDOW_MS = 30 * 60 * 1000;
const BROADCAST_DUPLICATE_LIMIT = 3;

async function hasSharedTechContext(senderId: string, receiverId: string) {
  const project = await db.project.findFirst({
    where: {
      OR: [
        { ownerId: senderId, professionalId: receiverId },
        { ownerId: receiverId, professionalId: senderId },
        {
          ownerId: senderId,
          proposals: { some: { professionalId: receiverId } },
        },
        {
          ownerId: receiverId,
          proposals: { some: { professionalId: senderId } },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

async function hasPaidTechContext(senderId: string, receiverId: string) {
  const project = await db.project.findFirst({
    where: {
      status: { in: ["IN_PROGRESS", "UNDER_REVIEW", "COMPLETED", "DISPUTE"] },
      OR: [
        { ownerId: senderId, professionalId: receiverId },
        { ownerId: receiverId, professionalId: senderId },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

async function hasRecentDuplicateMessage({
  senderId,
  receiverId,
  content,
}: {
  senderId: string;
  receiverId: string;
  content: string;
}) {
  const createdAt = new Date(Date.now() - DUPLICATE_WINDOW_MS);

  const duplicate = await db.message.findFirst({
    where: {
      senderId,
      content,
      createdAt: { gte: createdAt },
      conversation: {
        OR: [
          { participantAId: senderId, participantBId: receiverId },
          { participantAId: receiverId, participantBId: senderId },
        ],
      },
    },
    select: { id: true },
  });

  return Boolean(duplicate);
}

async function isBroadcastSpam(senderId: string, content: string) {
  const createdAt = new Date(Date.now() - BROADCAST_WINDOW_MS);
  const count = await db.message.count({
    where: {
      senderId,
      content,
      createdAt: { gte: createdAt },
    },
  });

  return isBroadcastDuplicateLimitReached({
    previousCount: count,
    limit: BROADCAST_DUPLICATE_LIMIT,
  });
}

export async function sendMessage(
  receiverId: string,
  content: string,
): Promise<ActionResponse<{ id: string; createdAt: Date }>> {
  try {
    const session = await verifySession();
    const senderId = session?.sub as string;
    const normalizedContent = normalizeMessageContent(content);

    if (!senderId) return { success: false, error: "Nao autorizado." };

    if (session?.industry !== "TECH") {
      return {
        success: false,
        error: "Acao restrita ao Marketplace Tech.",
      };
    }

    if (!receiverId || receiverId === senderId) {
      return { success: false, error: "Destinatario invalido." };
    }

    if (!normalizedContent) {
      return { success: false, error: "Mensagem vazia." };
    }

    if (isMessageTooLong(normalizedContent)) {
      return {
        success: false,
        error: `Mensagem muito longa. Limite de ${CHAT_MAX_CONTENT_LENGTH} caracteres.`,
      };
    }

    const pairKey = [senderId, receiverId].sort().join(":");
    const userLimitError = await consumeRateLimit({
      key: `chat:send:user:${senderId}`,
      limit: CHAT_USER_LIMIT,
      windowMs: CHAT_WINDOW_MS,
      message: "Voce esta enviando mensagens rapido demais.",
    });
    const pairLimitError = await consumeRateLimit({
      key: `chat:send:pair:${pairKey}`,
      limit: CHAT_PAIR_LIMIT,
      windowMs: CHAT_WINDOW_MS,
      message: "Aguarde um instante antes de enviar novas mensagens.",
    });

    if (userLimitError || pairLimitError) {
      return {
        success: false,
        error: userLimitError || pairLimitError || "Muitas tentativas.",
      };
    }

    const duplicate = await hasRecentDuplicateMessage({
      senderId,
      receiverId,
      content: normalizedContent,
    });

    if (duplicate) {
      return {
        success: false,
        error: "Mensagem repetida detectada. Aguarde antes de reenviar.",
      };
    }

    const broadcastSpam = await isBroadcastSpam(senderId, normalizedContent);

    if (broadcastSpam) {
      return {
        success: false,
        error: "Envio repetido para varias conversas bloqueado.",
      };
    }

    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
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
          { participantAId: senderId, participantBId: receiverId },
          { participantAId: receiverId, participantBId: senderId },
        ],
      },
    });

    if (!conversation) {
      const newConversationLimitError = await consumeRateLimit({
        key: `chat:new-conversation:user:${senderId}`,
        limit: CHAT_NEW_CONVERSATION_LIMIT,
        windowMs: CHAT_NEW_CONVERSATION_WINDOW_MS,
        message: "Voce iniciou muitas conversas em pouco tempo.",
      });

      if (newConversationLimitError) {
        return { success: false, error: newConversationLimitError };
      }

      const receiverIsPublicTechProfessional =
        receiver.userType === "PROFESSIONAL" && receiver.industry === "TECH";
      const hasSharedContext = await hasSharedTechContext(senderId, receiverId);

      if (!receiverIsPublicTechProfessional && !hasSharedContext) {
        return {
          success: false,
          error:
            "Conversa permitida apenas com profissional Tech ou usuarios com projeto/proposta em comum.",
        };
      }
    }

    const hasExternalContact = containsExternalContact(normalizedContent);
    if (hasExternalContact) {
      const paidContext = await hasPaidTechContext(senderId, receiverId);

      if (
        !canSendExternalContact({
          content: normalizedContent,
          hasPaidContext: paidContext,
        })
      ) {
        return {
          success: false,
          error:
            "Dados de contato externo e links so sao permitidos apos um projeto pago/ativo entre as partes.",
        };
      }
    }

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participantAId: senderId,
          participantBId: receiverId,
          lastMessage: normalizedContent,
          lastMessageTime: new Date(),
          unreadCountA: 0,
          unreadCountB: 1,
          deletedByIds: [],
        },
      });
    } else {
      const isSenderA = conversation.participantAId === senderId;

      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: normalizedContent,
          lastMessageTime: new Date(),
          unreadCountA: isSenderA
            ? conversation.unreadCountA
            : { increment: 1 },
          unreadCountB: !isSenderA
            ? conversation.unreadCountB
            : { increment: 1 },
          deletedByIds: [],
        },
      });
    }

    const newMessage = await db.message.create({
      data: {
        content: normalizedContent,
        senderId,
        conversationId: conversation.id,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, data: newMessage };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar mensagem." };
  }
}
