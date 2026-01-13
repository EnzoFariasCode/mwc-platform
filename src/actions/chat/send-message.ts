"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function sendMessage(receiverId: string, content: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
    const senderId = session?.sub as string;

    if (!senderId) return { success: false, error: "Não autorizado" };
    if (!content.trim()) return { success: false, error: "Mensagem vazia" };

    // 1. Tenta achar conversa existente
    let conversation = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: senderId } } },
          { participants: { some: { id: receiverId } } },
        ],
      },
    });

    // 2. Se não existir, cria
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participants: {
            connect: [{ id: senderId }, { id: receiverId }],
          },
        },
      });
    }

    // 3. Cria a mensagem
    const newMessage = await db.message.create({
      data: {
        content: content,
        senderId: senderId,
        conversationId: conversation.id,
      },
    });

    // 4. Atualiza data da conversa (para ordenar na lista)
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, message: newMessage };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar" };
  }
}
