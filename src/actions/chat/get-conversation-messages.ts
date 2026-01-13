"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getConversationMessages(targetUserId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = await verifySession(token);
  const myId = session?.sub as string;

  if (!myId) return null;

  // Busca conversa
  const conversation = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: myId } } },
        { participants: { some: { id: targetUserId } } },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      participants: {
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          displayName: true,
          jobTitle: true,
          // avatarUrl: true
        },
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

  const otherUser = conversation.participants[0];

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
}
