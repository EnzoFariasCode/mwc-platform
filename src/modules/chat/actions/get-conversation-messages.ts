"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";
import { findChatBlockBetween } from "@/modules/chat/lib/chat-moderation";

type ConversationMessages = {
  conversationId: string;
  messages: {
    id: string;
    text: string;
    sender: "me" | "other";
    time: Date;
  }[];
  otherUser: {
    id: string;
    name: string;
    jobTitle: string | null;
    isFavorite: boolean;
    canFavorite: boolean;
  };
};

export async function getConversationMessages(
  targetUserId: string,
): Promise<ActionResponse<ConversationMessages | null>> {
  try {
    const session = await verifySession();
    const myId = session?.sub as string;

    if (!myId) return { success: false, error: "Nao autorizado." };

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Ação restrita ao Marketplace Tech.",
      };
    }

    if (session?.industry !== "TECH") {
      return { success: false, error: "Acao restrita ao Marketplace Tech." };
    }

    if (await findChatBlockBetween(myId, targetUserId)) {
      return { success: false, error: "Esta conversa esta bloqueada." };
    }

    // Busca conversa onde EU e o ALVO estamos
    const conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: myId, participantBId: targetUserId },
          { participantAId: targetUserId, participantBId: myId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        // Trazemos os dados dos dois para saber quem é quem
        participantA: {
          select: {
            id: true,
            name: true,
            displayName: true,
            jobTitle: true,
            userType: true,
            industry: true,
          },
        },
        participantB: {
          select: {
            id: true,
            name: true,
            displayName: true,
            jobTitle: true,
            userType: true,
            industry: true,
          },
        },
      },
    });

    if (!conversation) return { success: true, data: null };

    // Identifica quem é o "Outro Usuário"
    const otherUser =
      conversation.participantAId === myId
        ? conversation.participantB
        : conversation.participantA;
    const canFavorite =
      session.userType === "CLIENT" &&
      otherUser.userType === "PROFESSIONAL" &&
      otherUser.industry === "TECH";
    const isFavorite = canFavorite
      ? await db.favorite.findUnique({
          where: {
            clientId_professionalId: {
              clientId: myId,
              professionalId: otherUser.id,
            },
          },
        })
      : null;

    const data: ConversationMessages = {
      conversationId: conversation.id,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        // 🛡️ A MARRETADA: Forçamos o tipo para o TypeScript parar de reclamar
        sender: (msg.senderId === myId ? "me" : "other") as "me" | "other",
        time: msg.createdAt,
      })),
      otherUser: {
        id: otherUser.id,
        // Garante que name sempre será uma string (fazendo fallback se tudo for nulo)
        name: otherUser.displayName || otherUser.name || "Usuário",
        jobTitle: otherUser.jobTitle,
        isFavorite: !!isFavorite,
        canFavorite,
      },
    };

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return { success: false, error: "Erro interno." };
  }
}
