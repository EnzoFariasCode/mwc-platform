"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function getMyFavorites() {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return [];

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

    return favorites.map((fav) => ({
      id: fav.professional.id,
      name: fav.professional.displayName || fav.professional.name,
      jobTitle: fav.professional.jobTitle || "Profissional",
      rating: fav.professional.rating,
      ratingCount: fav.professional.ratingCount,
      hourlyRate: fav.professional.hourlyRate,
      avatarUrl: null, // Placeholder ou campo real
    }));
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return [];
  }
}
