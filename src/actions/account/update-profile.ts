"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActionResponse } from "@/types/user-types";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Interface auxiliar para os itens de lista (JSON)
interface PortfolioItem {
  title: string;
  url: string;
}

// Interface completa com todos os campos
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
    const cookieStore = await cookies();

    // --- SEGURANÇA (JWT) ---
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

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

    // 3. Lógica de Senha
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
        city: data.city, // <--- Isso vai preencher o campo e remover o Modal
        state: data.state, // <--- Isso vai preencher o campo e remover o Modal

        // Campos Profissionais
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        jobTitle: data.jobTitle,
        skills: data.skills,

        // --- NOVOS CAMPOS (Redes e JSONs) ---
        socialGithub: data.socialGithub,
        socialLinkedin: data.socialLinkedin,
        portfolio: data.portfolio as any,
        certificates: data.certificates as any,

        // Senha (apenas se alterada)
        ...(passwordHash && { password: passwordHash }),
      },
    });

    // 5. ATUALIZAR O CACHE
    // Importante: Revalidar a dashboard para que ela perceba que o perfil agora está completo
    revalidatePath("/dashboard/perfil");
    revalidatePath("/dashboard/cliente"); // <--- ADICIONADO: Garante que o modal suma na hora
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Erro interno ao atualizar perfil." };
  }
}
