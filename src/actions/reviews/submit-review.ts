"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(
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

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        status: true,
        ownerId: true,
        professionalId: true,
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.professionalId !== userId) {
      return {
        success: false,
        error: "Voce nao tem permissao para avaliar este projeto.",
      };
    }

    if (project.status !== "COMPLETED") {
      return {
        success: false,
        error: "Somente projetos concluidos podem ser avaliados.",
      };
    }

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
        where: { id: project.ownerId },
        select: { rating: true, ratingCount: true },
      });

      if (!target) {
        throw new Error("Cliente nao encontrado.");
      }

      const currentCount = target?.ratingCount ?? 0;
      const currentAvg = target?.rating ?? 0;
      const nextCount = currentCount + 1;
      const nextAvg = (currentAvg * currentCount + rating) / nextCount;

      await tx.review.create({
        data: {
          projectId: project.id,
          authorId: userId,
          targetId: project.ownerId,
          rating,
          comment: normalizedComment,
        },
      });

      await tx.user.update({
        where: { id: project.ownerId },
        data: {
          rating: nextAvg,
          ratingCount: nextCount,
        },
      });
    });

    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/encontrar-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar avaliacao:", error);
    if (error instanceof Error) {
      if (error.message.includes("Avaliacao ja enviada")) {
        return { success: false, error: error.message };
      }
      if (error.message.includes("Cliente nao encontrado")) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Erro interno ao enviar avaliacao." };
  }
}
