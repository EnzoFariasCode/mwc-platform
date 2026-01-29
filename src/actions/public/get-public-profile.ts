"use server";

import { db } from "@/lib/prisma";

export async function getPublicProfile(userId: string) {
  try {
    const professional = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        city: true,
        state: true,
        userType: true,
        jobTitle: true,
        hourlyRate: true,
        rating: true,
        skills: true,
        portfolio: true, // Assumindo que é um JSON no banco
        certificates: true, // Assumindo que é um JSON no banco
        socialGithub: true,
        socialLinkedin: true,
        createdAt: true,
      },
    });

    if (!professional) return null;

    // Opcional: Se quiser garantir que apenas PROFISSIONAIS apareçam:
    // if (professional.userType !== "PROFESSIONAL") return null;

    return professional;
  } catch (error) {
    console.error("Erro ao buscar perfil público:", error);
    return null;
  }
}
