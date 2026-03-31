"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";
import { Prisma, UserType } from "@prisma/client";

type PrivateUserProfile = {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  birthDate: Date | null;
  userType: UserType;
  bio: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  hourlyRate: number | null;
  rating: number;
  ratingCount: number;
  jobTitle: string | null;
  skills: string[];
  socialGithub: string | null;
  socialLinkedin: string | null;
  portfolio: Prisma.JsonValue | null;
  certificates: Prisma.JsonValue | null;
  avatarUrl: string | null;
};

export async function getUserProfile(): Promise<ActionResponse<PrivateUserProfile>> {
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
