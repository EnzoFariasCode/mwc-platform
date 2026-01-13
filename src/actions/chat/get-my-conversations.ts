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
      participants: { some: { id: userId } },
    },
    include: {
      participants: {
        where: { id: { not: userId } }, // Pega o "outro" participante
        select: {
          id: true,
          name: true,
          displayName: true,
          jobTitle: true,
          // avatarUrl: true
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Última mensagem para preview
      },
      // CORREÇÃO: Contar mensagens não lidas que NÃO fui eu que mandei
      _count: {
        select: {
          messages: {
            where: {
              read: false,
              senderId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return conversations
    .map((conv) => {
      const otherUser = conv.participants[0];
      const lastMsg = conv.messages[0];

      if (!otherUser) return null;

      return {
        id: conv.id,
        otherUserId: otherUser.id,
        name: otherUser.displayName || otherUser.name,
        jobTitle: otherUser.jobTitle,
        lastMessage: lastMsg?.content || "Inicie uma conversa",
        lastMessageTime: lastMsg?.createdAt,
        avatar: null,
        unreadCount: conv._count.messages, // Novo campo
      };
    })
    .filter(Boolean);
}
