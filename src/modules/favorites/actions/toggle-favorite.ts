"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function toggleFavorite(
  professionalId: string
): Promise<ActionResponse<{ isFavorite: boolean }>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // Verifica se já é favorito
    const existing = await db.favorite.findUnique({
      where: {
        clientId_professionalId: {
          clientId: userId,
          professionalId: professionalId,
        },
      },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
    } else {
      await db.favorite.create({
        data: {
          clientId: userId,
          professionalId: professionalId,
        },
      });
    }

    revalidatePath("/dashboard/favoritos");
    revalidatePath("/dashboard/chat");
    return { success: true, data: { isFavorite: !existing } };
  } catch (error) {
    console.error("Erro ao favoritar:", error);
    return { success: false, error: "Erro interno" };
  }
}
