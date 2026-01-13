"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getMyFavorites() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await verifySession(token);
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
      hourlyRate: fav.professional.hourlyRate,
      avatarUrl: null, // Placeholder ou campo real
    }));
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return [];
  }
}
