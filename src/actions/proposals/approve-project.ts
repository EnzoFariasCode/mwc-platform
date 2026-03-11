"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveProject(projectId: string) {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Verifica se o projeto existe e se o usuário é o dono
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        professional: true, // Precisamos saber quem é o profissional para pagar a ele
      },
    });

    if (!project) return { success: false, error: "Projeto não encontrado" };
    if (project.ownerId !== userId) {
      return { success: false, error: "Apenas o dono pode aprovar a entrega." };
    }

    if (!project.professionalId || !project.agreedPrice) {
      return {
        success: false,
        error: "Erro: Profissional ou valor não definidos neste projeto.",
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
            increment: valorProfissional, // <-- CORRIGIDO AQUI: Passando só os 90%
          },
        },
      }),

      db.transaction.create({
        data: {
          userId: project.professionalId,
          amount: valorProfissional, // <-- CORRIGIDO AQUI: Passando só os 90%
          type: "CREDIT",
          status: "COMPLETED",
          description: `Pagamento (Taxa de 10% aplicada) - Projeto: ${project.title}`, // Aviso no extrato
          projectId: project.id,
        },
      }),
    ]);

    // Revalida as páginas para atualizar os dados em tempo real
    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/financeiro"); // Adicionado para forçar o financeiro a ler o novo saldo

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar projeto e liberar pagamento:", error);
    return {
      success: false,
      error: "Erro interno ao finalizar projeto e transferir valores.",
    };
  }
}
