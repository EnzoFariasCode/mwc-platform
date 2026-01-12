"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActionResponse } from "@/types/user-types";

// Interface auxiliar para os itens de lista (JSON)
interface PortfolioItem {
  title: string;
  url: string;
}

// Interface completa com todos os campos (Antigos + Novos)
interface UpdateProfileData {
  name: string;
  displayName: string;
  birthDate: string;
  bio?: string;
  city?: string;
  state?: string;
  hourlyRate?: string;
  jobTitle?: string;
  skills?: string[];

  // --- NOVOS CAMPOS ---
  socialGithub?: string;
  socialLinkedin?: string;
  portfolio?: PortfolioItem[];
  certificates?: PortfolioItem[];

  // --- SEGURANÇA ---
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResponse> {
  try {
    // 1. Verificação de Sessão
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 2. Busca usuário no banco
    const userInDb = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // 3. Lógica de Senha (Mantida intacta)
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

    // 4. Atualização no Banco de Dados
    await db.user.update({
      where: { id: userId },
      data: {
        // Campos Básicos
        name: data.name,
        displayName: data.displayName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        bio: data.bio,
        city: data.city,
        state: data.state,

        // Campos Profissionais (Numéricos/Strings)
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        jobTitle: data.jobTitle,
        skills: data.skills,

        // --- NOVOS CAMPOS (Redes e JSONs) ---
        socialGithub: data.socialGithub,
        socialLinkedin: data.socialLinkedin,
        // Usamos 'as any' para garantir que o Prisma aceite o array de objetos no campo JSON
        portfolio: data.portfolio as any,
        certificates: data.certificates as any,

        // Senha (apenas se alterada)
        ...(passwordHash && { password: passwordHash }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Erro interno ao atualizar perfil." };
  }
}
