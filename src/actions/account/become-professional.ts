"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { UserType } from "@prisma/client";
import { verifySession } from "@/lib/auth";

// Interface dos dados que esperamos receber
interface BecomeProfessionalData {
  jobTitle: string;
  yearsOfExperience: number;
}

export async function becomeProfessional(data: BecomeProfessionalData) {
  try {
    const cookieStore = await cookies();

    // 1. Pega o ID do usuário através da Sessão Segura (JWT)
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!data.jobTitle) {
      return { success: false, error: "Profissão é obrigatória." };
    }

    // 2. Atualiza o usuário no Banco com os novos campos
    await db.user.update({
      where: { id: userId },
      data: {
        userType: UserType.PROFESSIONAL,
        jobTitle: data.jobTitle, // <--- Salva o Cargo
        yearsOfExperience: data.yearsOfExperience, // <--- Salva a Experiência
      },
    });

    // 3. Atualiza as caches para o Header/Sidebar mudarem imediatamente
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao virar profissional:", error);
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}
