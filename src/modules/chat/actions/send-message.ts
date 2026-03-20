"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function sendMessage(
  receiverId: string,
  content: string
): Promise<ActionResponse<{ id: string; createdAt: Date }>> {
  try {
    const session = await verifySession();
    const senderId = session?.sub as string;

    if (!senderId) return { success: false, error: "Não autorizado" };
    if (!content.trim()) return { success: false, error: "Mensagem vazia" };

    // 1. Tenta achar conversa existente
    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: senderId, participantBId: receiverId },
          { participantAId: receiverId, participantBId: senderId },
        ],
      },
    });

    // 2. Se não existir, cria
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participantAId: senderId,
          participantBId: receiverId,
          lastMessage: content,
          lastMessageTime: new Date(),
          unreadCountA: 0,
          unreadCountB: 1,
          deletedByIds: [],
        },
      });
    } else {
      // 3. Se já existe, atualiza
      const isSenderA = conversation.participantAId === senderId;

      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: content,
          lastMessageTime: new Date(),
          unreadCountA: isSenderA
            ? conversation.unreadCountA
            : { increment: 1 },
          unreadCountB: !isSenderA
            ? conversation.unreadCountB
            : { increment: 1 },
          deletedByIds: [], // Ressuscita conversa
        },
      });
    }

    // 4. Cria a mensagem
    const newMessage = await db.message.create({
      data: {
        content: content,
        senderId: senderId,
        conversationId: conversation.id,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, data: newMessage };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar" };
  }
}
