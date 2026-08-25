"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { markEntityNotificationsRead } from "@/modules/notifications/services/notification-service";
import { findChatBlockBetween } from "@/modules/chat/lib/chat-moderation";
import { cancelPendingTechChatEmails } from "@/modules/email/services/tech-email-service";

export async function markMessagesAsRead(
  targetUserId: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const myId = session?.sub as string;

    if (!myId) return { success: false, error: "Nao autorizado." };

    if (session?.industry !== "TECH") {
      return {
        success: false,
        error: "Ação restrita ao Marketplace Tech.",
      };
    }

    if (await findChatBlockBetween(myId, targetUserId)) {
      return { success: false, error: "Esta conversa esta bloqueada." };
    }

    // Busca a conversa
    const conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: myId, participantBId: targetUserId },
          { participantAId: targetUserId, participantBId: myId },
        ],
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversa nao encontrada." };
    }

    // Se eu sou o A, zero o unreadCountA. Se sou B, zero o unreadCountB.
    const isImParticipantA = conversation.participantAId === myId;

    await db.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          ...(isImParticipantA ? { unreadCountA: 0 } : { unreadCountB: 0 }),
        },
      });

      await tx.message.updateMany({
        where: {
          conversationId: conversation.id,
          senderId: targetUserId,
          read: false,
        },
        data: { read: true },
      });

      await markEntityNotificationsRead({
        userId: myId,
        entityType: "CONVERSATION",
        entityId: conversation.id,
      }, tx);

      await cancelPendingTechChatEmails(tx, {
        conversationId: conversation.id,
        recipientUserId: myId,
      });
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
    return { success: false, error: "Erro ao atualizar conversa." };
  }
}
