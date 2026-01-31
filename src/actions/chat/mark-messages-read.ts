"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markMessagesAsRead(targetUserId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
    const myId = session?.sub as string;

    if (!myId) return { success: false };

    // Busca a conversa
    const conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: myId, participantBId: targetUserId },
          { participantAId: targetUserId, participantBId: myId },
        ],
      },
    });

    if (!conversation) return { success: false };

    // Se eu sou o A, zero o unreadCountA. Se sou B, zero o unreadCountB.
    const isImParticipantA = conversation.participantAId === myId;

    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        // Zera APENAS o meu contador
        ...(isImParticipantA ? { unreadCountA: 0 } : { unreadCountB: 0 }),
      },
    });

    // Opcional: Marcar flag "read" nas mensagens individuais (para tique azul)
    // Isso pode ser pesado se tiver mil mensagens, mas ok para MVP.
    await db.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: targetUserId, // Mensagens enviadas pelo OUTRO
        read: false,
      },
      data: { read: true },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
    return { success: false };
  }
}
