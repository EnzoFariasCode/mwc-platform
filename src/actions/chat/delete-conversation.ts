"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteConversation(conversationId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // Verifica se o usuário participa dessa conversa antes de deletar
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation)
      return { success: false, error: "Conversa não encontrada" };

    const isParticipant = conversation.participants.some(
      (p) => p.id === userId
    );
    if (!isParticipant) return { success: false, error: "Permissão negada" };

    // Deleta a conversa (O Cascade no Schema vai apagar as mensagens automaticamente)
    await db.conversation.delete({
      where: { id: conversationId },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar conversa:", error);
    return { success: false, error: "Erro interno" };
  }
}
