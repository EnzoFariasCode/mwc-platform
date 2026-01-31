"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getConversationMessages(targetUserId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
    const myId = session?.sub as string;

    if (!myId) return null;

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
          select: { id: true, name: true, displayName: true, jobTitle: true },
        },
        participantB: {
          select: { id: true, name: true, displayName: true, jobTitle: true },
        },
      },
    });

    if (!conversation) return null;

    // Verifica favorito
    const isFavorite = await db.favorite.findUnique({
      where: {
        clientId_professionalId: {
          clientId: myId,
          professionalId: targetUserId,
        },
      },
    });

    // Identifica quem é o "Outro Usuário"
    const otherUser =
      conversation.participantAId === myId
        ? conversation.participantB
        : conversation.participantA;

    return {
      conversationId: conversation.id,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderId === myId ? "me" : "other",
        time: msg.createdAt,
      })),
      otherUser: {
        id: otherUser.id,
        name: otherUser.displayName || otherUser.name,
        jobTitle: otherUser.jobTitle,
        isFavorite: !!isFavorite,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return null;
  }
}
