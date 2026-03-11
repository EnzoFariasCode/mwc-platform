"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function getUserProfile() {
  try {
    const session = await verifySession();

    if (!session || !session.sub) return null;

    const userId = session.sub as string;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        birthDate: true,
        userType: true,
        bio: true,
        city: true,
        state: true,
        createdAt: true,
        hourlyRate: true,
        rating: true,
        jobTitle: true,
        skills: true,
        socialGithub: true,
        socialLinkedin: true,
        portfolio: true,
        certificates: true,
        // --- ADICIONADO: Precisamos checar se existe imagem ---
        profileImageBytes: true,
      },
    });

    if (!user) return null;

    // --- LÓGICA DA IMAGEM ---
    const avatarUrl = user.profileImageBytes
      ? `/api/images/user/${user.id}`
      : null;

    // Removemos o arquivo pesado antes de enviar para o front
    const { profileImageBytes, ...rest } = user;

    return {
      ...rest,
      avatarUrl, // O frontend vai usar isso
    };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}
