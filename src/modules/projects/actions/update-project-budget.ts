"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function updateProjectBudget(
  projectId: string,
  budgetValue: number
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado." };

    if (!projectId || !Number.isFinite(budgetValue) || budgetValue <= 0) {
      return { success: false, error: "Valor invalido." };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, status: true, budgetType: true },
    });

    if (!project || project.ownerId !== userId) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.status !== ProjectStatus.OPEN) {
      return {
        success: false,
        error: "Somente anuncios em aberto podem ser editados.",
      };
    }

    const prefix = "R$ ";
    const suffix = project.budgetType === "hourly" ? "/h" : "";
    const budgetLabel = `${prefix}${budgetValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}${suffix}`;

    await db.project.update({
      where: { id: projectId },
      data: {
        budgetValue,
        budgetLabel,
      },
    });

    revalidatePath("/dashboard/anuncios");
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar orcamento:", error);
    return { success: false, error: "Erro ao atualizar orcamento." };
  }
}
