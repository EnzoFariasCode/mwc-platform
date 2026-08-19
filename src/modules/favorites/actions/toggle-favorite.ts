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

    if (session?.userType !== "CLIENT" || session?.industry !== "TECH") {
      return {
        success: false,
        error: "Apenas clientes do Marketplace Tech podem favoritar profissionais.",
      };
    }

    const block = await db.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedUserId: professionalId },
          { blockerId: professionalId, blockedUserId: userId },
        ],
      },
      select: { id: true },
    });

    if (block) {
      return {
        success: false,
        error: "Nao e possivel favoritar uma conta bloqueada.",
      };
    }

    const professional = await db.user.findFirst({
      where: {
        id: professionalId,
        userType: "PROFESSIONAL",
        industry: "TECH",
      },
      select: { id: true },
    });

    if (!professional) {
      return {
        success: false,
        error: "Profissional de Tecnologia não encontrado.",
      };
    }

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
