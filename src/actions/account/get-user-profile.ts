"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export async function getUserProfile() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return null;
    }

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
