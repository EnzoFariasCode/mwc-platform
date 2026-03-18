"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveProject(
  projectId: string,
  rating: number,
  comment?: string
) {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado" };

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "Nota invalida (1 a 5)." };
    }

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

    const professionalId = project.professionalId;
    if (!professionalId || !project.agreedPrice) {
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

    const normalizedComment =
      comment && comment.trim().length > 0 ? comment.trim() : null;

    await db.$transaction(async (tx) => {
      const existingReview = await tx.review.findUnique({
        where: {
          projectId_authorId: {
            projectId,
            authorId: userId,
          },
        },
        select: { id: true },
      });

      if (existingReview) {
        throw new Error("Avaliacao ja enviada para este projeto.");
      }

      const target = await tx.user.findUnique({
        where: { id: professionalId },
        select: { rating: true, ratingCount: true },
      });

      if (!target) {
        throw new Error("Profissional nao encontrado.");
      }

      const currentCount = target?.ratingCount ?? 0;
      const currentAvg = target?.rating ?? 0;
      const nextCount = currentCount + 1;
      const nextAvg = (currentAvg * currentCount + rating) / nextCount;

      await tx.project.update({
        where: { id: projectId },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.user.update({
        where: { id: professionalId },
        data: {
          walletBalance: {
            increment: valorProfissional,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: professionalId,
          amount: valorProfissional,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Pagamento (Taxa de 10% aplicada) - Projeto: ${project.title}`,
          projectId: project.id,
        },
      });

      await tx.review.create({
        data: {
          projectId: project.id,
          authorId: userId,
          targetId: professionalId,
          rating,
          comment: normalizedComment,
        },
      });

      await tx.user.update({
        where: { id: professionalId },
        data: {
          rating: nextAvg,
          ratingCount: nextCount,
        },
      });
    });

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/financeiro");
    revalidatePath(`/dashboard/profissional/${professionalId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar projeto e liberar pagamento:", error);
    if (error instanceof Error) {
      if (error.message.includes("Avaliacao ja enviada")) {
        return { success: false, error: error.message };
      }
      if (error.message.includes("Profissional nao encontrado")) {
        return { success: false, error: error.message };
      }
    }
    return {
      success: false,
      error: "Erro interno ao finalizar projeto e transferir valores.",
    };
  }
}
