"use server";

import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActionResponse } from "@/modules/users/types/user-types";

type NotificationItem = {
  id: string;
  type: "message" | "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
};

const typeMap = {
  MESSAGE: "message",
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
} as const;

export async function getNotifications(): Promise<
  ActionResponse<NotificationItem[]>
> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado." };
  }

  const persisted = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });

  const notifications: NotificationItem[] = persisted.map((item) => ({
    id: item.id,
    type: typeMap[item.type],
    title: item.title,
    message: item.message,
    time: formatDistanceToNow(item.createdAt, {
      addSuffix: true,
      locale: ptBR,
    }),
    read: Boolean(item.readAt),
    link: item.link || "/dashboard",
  }));

  const hasUnreadChatNotification = notifications.some(
    (item) => item.type === "message" && !item.read,
  );

  if (!hasUnreadChatNotification) {
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participantAId: session.id, unreadCountA: { gt: 0 } },
          { participantBId: session.id, unreadCountB: { gt: 0 } },
        ],
      },
      include: {
        participantA: { select: { name: true } },
        participantB: { select: { name: true } },
      },
      take: 10,
    });

    conversations.forEach((conv) => {
      const senderName =
        conv.participantAId === session.id
          ? conv.participantB.name
          : conv.participantA.name;

      notifications.push({
        id: `legacy-msg-${conv.id}`,
        type: "message",
        title: "Nova Mensagem",
        message: `${senderName} enviou uma mensagem para voce.`,
        time: formatDistanceToNow(conv.lastMessageTime, {
          addSuffix: true,
          locale: ptBR,
        }),
        read: false,
        link: `/dashboard/chat?id=${conv.id}`,
      });
    });
  }

  return { success: true, data: notifications };
}
