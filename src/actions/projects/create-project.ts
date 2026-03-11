"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth"; // <--- Importante: Importar a função de segurança

interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  budgetType: "fixed" | "hourly";
  budgetValue: number;
  deadline: string;
  attachments: string[];
}

export async function createProject(data: CreateProjectData) {
  try {
    // --- LÓGICA NOVA DE AUTH (NEXTAUTH) ---
    const session = await verifySession();
    const userId = session?.sub as string; // Extrai o ID do token assinado

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }
    // ---------------------------------

    const prefix = data.budgetType === "fixed" ? "R$ " : "R$ ";
    const suffix = data.budgetType === "hourly" ? "/h" : "";
    const budgetLabel = `${prefix}${data.budgetValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}${suffix}`;

    await db.project.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        budgetType: data.budgetType,
        budgetValue: data.budgetValue,
        budgetLabel: budgetLabel,
        deadline: data.deadline,
        ownerId: userId, // Usa o ID seguro
        status: "OPEN",
        attachments: data.attachments,
      },
    });

    revalidatePath("/dashboard/cliente");
    revalidatePath("/dashboard/encontrar-projetos");
    // Revalida também a página de "Meus Projetos" para aparecer na lista imediatamente
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return { success: false, error: "Erro ao publicar projeto." };
  }
}
