"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveProject(projectId: string) {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado" };

    // 1. Verifica se o projeto existe e se o usuario e o dono
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        professional: true,
      },
    });

    if (!project) return { success: false, error: "Projeto nao encontrado" };
    if (project.ownerId !== userId) {
      return { success: false, error: "Apenas o dono pode aprovar a entrega." };
    }

    if (!project.professionalId || !project.agreedPrice) {
      return {
        success: false,
        error: "Erro: Profissional ou valor nao definidos neste projeto.",
      };
    }

    if (project.status !== "UNDER_REVIEW") {
      return {
        success: false,
        error: "Status invalido para aprovacao.",
      };
    }

    // Calcula os 10% da plataforma
    const valorDoPagamento = Number(project.agreedPrice);
    const taxaPlataforma = valorDoPagamento * 0.1;
    const valorProfissional = valorDoPagamento - taxaPlataforma;

    await db.$transaction([
      db.project.update({
        where: { id: projectId },
        data: {
          status: "COMPLETED",
        },
      }),

      db.user.update({
        where: { id: project.professionalId },
        data: {
          walletBalance: {
            increment: valorProfissional,
          },
        },
      }),

      db.transaction.create({
        data: {
          userId: project.professionalId,
          amount: valorProfissional,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Pagamento (Taxa de 10% aplicada) - Projeto: ${project.title}`,
          projectId: project.id,
        },
      }),
    ]);

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/financeiro");

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar projeto e liberar pagamento:", error);
    return {
      success: false,
      error: "Erro interno ao finalizar projeto e transferir valores.",
    };
  }
}
