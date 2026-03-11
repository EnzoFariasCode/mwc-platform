"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteConversation(conversationId: string) {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Não autorizado" };
    }

    // Busca a conversa para ver se participo
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return { success: false, error: "Conversa não encontrada" };
    }

    // Verifica se sou A ou B
    const isParticipant =
      conversation.participantAId === userId ||
      conversation.participantBId === userId;

    if (!isParticipant) {
      return { success: false, error: "Permissão negada" };
    }

    // Soft Delete: Apenas adiciona meu ID na lista de excluídos
    // (Não deletamos do banco para manter o histórico para o outro usuário)
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        deletedByIds: {
          push: userId,
        },
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar conversa:", error);
    return { success: false, error: "Erro interno" };
  }
}
