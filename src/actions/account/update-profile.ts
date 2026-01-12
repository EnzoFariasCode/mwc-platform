"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActionResponse } from "@/types/user-types";

// 1. Atualizamos a interface para aceitar 'skills'
interface UpdateProfileData {
  name: string;
  displayName: string;
  birthDate: string;
  bio?: string;
  city?: string;
  state?: string;
  hourlyRate?: string;
  jobTitle?: string;
  skills?: string[]; // <--- ADICIONADO AQUI
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userInDb = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      return { success: false, error: "Usuário não encontrado." };
    }

    let passwordHash = undefined;

    if (data.newPassword && data.newPassword.trim() !== "") {
      if (!data.currentPassword) {
        return { success: false, error: "Informe a senha atual para alterar." };
      }

      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        userInDb.password
      );

      if (!isPasswordValid) {
        return { success: false, error: "Senha atual incorreta." };
      }

      passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    // 2. Atualizamos o banco de dados incluindo 'skills'
    await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        displayName: data.displayName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        bio: data.bio,
        city: data.city,
        state: data.state,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        jobTitle: data.jobTitle,
        skills: data.skills, // <--- SALVANDO O ARRAY NO BANCO
        ...(passwordHash && { password: passwordHash }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Erro interno ao atualizar perfil." };
  }
}
