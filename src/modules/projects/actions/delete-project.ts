"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function deleteProject(
  projectId: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Não autorizado" };
    }

    // Verifica se o projeto existe e pertence ao usuário
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { success: false, error: "Projeto não encontrado" };
    }

    if (project.ownerId !== userId) {
      return {
        success: false,
        error: "Você não tem permissão para excluir este projeto",
      };
    }

    // Deleta o projeto
    await db.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/dashboard/meus-projetos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    return { success: false, error: "Erro interno ao excluir projeto" };
  }
}
