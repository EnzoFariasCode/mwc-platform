"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function getProjectProposals(
  projectId: string
): Promise<ActionResponse<any[]>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Verifica se o projeto é MEU (Segurança)
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== userId) {
      return {
        success: false,
        error: "Você não tem permissão para ver estas propostas.",
      };
    }

    // 2. Busca as propostas
    const proposals = await db.proposal.findMany({
      where: { projectId },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            rating: true,
            ratingCount: true,
            userType: true,
            // avatarUrl: true, // Se tiver campo de foto, adicione aqui (ou delete se não tiver)
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeProposals = proposals.map((proposal) => ({
      ...proposal,
      price: proposal.price.toNumber(),
    }));

    return { success: true, data: safeProposals };
  } catch (error) {
    console.error("Erro ao buscar propostas:", error);
    return { success: false, error: "Erro interno." };
  }
}
