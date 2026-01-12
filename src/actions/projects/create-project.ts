"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  budgetType: "fixed" | "hourly";
  budgetValue: number;
  deadline: string;
  attachments: string[]; // <--- NOVO CAMPO
}

export async function createProject(data: CreateProjectData) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

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
        ownerId: userId,
        status: "OPEN",
        attachments: data.attachments, // <--- SALVA NO BANCO (JSON)
      },
    });

    revalidatePath("/dashboard/cliente");
    revalidatePath("/dashboard/encontrar-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return { success: false, error: "Erro ao publicar projeto." };
  }
}
