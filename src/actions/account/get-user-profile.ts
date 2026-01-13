"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth"; // <--- Importamos a segurança

export async function getUserProfile() {
  try {
    const cookieStore = await cookies();

    // 1. Pega o token seguro "session"
    const token = cookieStore.get("session")?.value;

    // Se não tiver token, retorna null
    if (!token) {
      return null;
    }

    // 2. Verifica a assinatura e abre o token
    const session = await verifySession(token);

    // Se o token for falso ou não tiver ID, retorna null
    if (!session || !session.sub) {
      return null;
    }

    const userId = session.sub as string; // O ID real vem daqui

    // 3. Sua busca original (mantida exatamente igual)
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
      },
    });

    return user;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}
