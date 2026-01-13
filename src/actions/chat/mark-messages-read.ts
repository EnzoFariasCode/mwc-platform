"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markMessagesAsRead(senderId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
    const myId = session?.sub as string;

    if (!myId) return { success: false };

    // Marca como lidas todas as mensagens que:
    // 1. Foram enviadas pelo "senderId" (o outro usuário)
    // 2. Estão em conversas onde "Eu" participo
    // 3. Ainda não foram lidas
    await db.message.updateMany({
      where: {
        senderId: senderId,
        read: false,
        conversation: {
          participants: {
            some: { id: myId },
          },
        },
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
    return { success: false };
  }
}
