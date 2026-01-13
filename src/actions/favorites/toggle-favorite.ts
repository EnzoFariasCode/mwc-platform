"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(professionalId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
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
    return { success: true, isFavorite: !existing };
  } catch (error) {
    console.error("Erro ao favoritar:", error);
    return { success: false, error: "Erro interno" };
  }
}
