"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function getUserProfile(): Promise<ActionResponse<any>> {
  try {
    const session = await verifySession();

    if (!session || !session.sub) {
      return { success: false, error: "Nao autorizado." };
    }

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
        ratingCount: true,
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

    if (!user) return { success: false, error: "Usuario nao encontrado." };

    // --- LÓGICA DA IMAGEM ---
    const avatarUrl = user.profileImageBytes
      ? `/api/images/user/${user.id}`
      : null;

    const hourlyRate = user.hourlyRate ? user.hourlyRate.toNumber() : null;

    // Removemos o arquivo pesado antes de enviar para o front
    const {
      profileImageBytes: _profileImageBytes,
      hourlyRate: _hourlyRate,
      ...rest
    } = user;
    void _profileImageBytes;
    void _hourlyRate;

    return {
      success: true,
      data: {
        ...rest,
        hourlyRate,
        avatarUrl, // O frontend vai usar isso
      },
    };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return { success: false, error: "Erro ao buscar perfil." };
  }
}
