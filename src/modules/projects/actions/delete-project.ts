"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function deleteProject(
  projectId: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Nao autorizado." };
    }

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Contas administrativas nao podem excluir projetos como cliente.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.ownerId !== userId) {
      return {
        success: false,
        error: "Voce nao tem permissao para excluir este projeto.",
      };
    }

    if (project.status !== "OPEN") {
      return {
        success: false,
        error:
          "Apenas projetos em aberto podem ser excluidos. Para outros status, use o cancelamento formal.",
      };
    }

    await db.project.delete({
      where: { id: project.id },
    });

    revalidatePath("/dashboard/meus-projetos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    return { success: false, error: "Erro interno ao excluir projeto." };
  }
}
