"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getMyConversations() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = await verifySession(token);
  const userId = session?.sub as string;

  if (!userId) return [];

  const conversations = await db.conversation.findMany({
    where: {
      AND: [
        // Sou participante (A ou B)
        {
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
        // E NÃO deletei (Soft Delete)
        {
          NOT: {
            deletedByIds: { has: userId },
          },
        },
      ],
    },
    include: {
      participantA: {
        select: { id: true, name: true, displayName: true, jobTitle: true },
      },
      participantB: {
        select: { id: true, name: true, displayName: true, jobTitle: true },
      },
      // Pega apenas a última msg para preview
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    // Se o campo for lastMessageTime, ajuste aqui. Se for lastMessageAt, ajuste.
    // Baseado no seu schema mais recente, vou usar lastMessageTime.
    orderBy: { lastMessageTime: "desc" },
  });

  return conversations.map((conv) => {
    // Descobre quem sou eu
    const isImParticipantA = conv.participantAId === userId;

    // O outro é o oposto
    const otherUser = isImParticipantA ? conv.participantB : conv.participantA;

    // Meu contador de não lidas
    const myUnreadCount = isImParticipantA
      ? conv.unreadCountA
      : conv.unreadCountB;

    // Última mensagem (pode vir do array messages ou do campo cacheado lastMessage)
    const lastMsgContent =
      conv.lastMessage || conv.messages[0]?.content || "Inicie uma conversa";
    const lastMsgTime = conv.lastMessageTime || conv.messages[0]?.createdAt;

    return {
      id: conv.id,
      otherUserId: otherUser.id,
      name: otherUser.displayName || otherUser.name,
      jobTitle: otherUser.jobTitle,
      lastMessage: lastMsgContent,
      lastMessageTime: lastMsgTime,
      avatar: null,
      unreadCount: myUnreadCount,
    };
  });
}
