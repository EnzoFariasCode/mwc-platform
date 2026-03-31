"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";

type FavoriteItem = {
  id: string;
  name: string;
  jobTitle: string | null;
  rating: number;
  ratingCount?: number;
  hourlyRate: number | null;
  avatarUrl: string | null;
};

export async function getMyFavorites(): Promise<ActionResponse<FavoriteItem[]>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado." };

    const favorites = await db.favorite.findMany({
      where: { clientId: userId },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            displayName: true,
            rating: true,
            ratingCount: true,
            jobTitle: true,
            hourlyRate: true,
            // Adicione avatarUrl aqui se tiver no seu schema User
          },
        },
      },
    });

    const data = favorites.map((fav) => ({
      id: fav.professional.id,
      name: fav.professional.displayName || fav.professional.name,
      jobTitle: fav.professional.jobTitle || "Profissional",
      rating: fav.professional.rating,
      ratingCount: fav.professional.ratingCount,
      hourlyRate: fav.professional.hourlyRate
        ? fav.professional.hourlyRate.toNumber()
        : null,
      avatarUrl: null, // Placeholder ou campo real
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return { success: false, error: "Erro interno." };
  }
}
