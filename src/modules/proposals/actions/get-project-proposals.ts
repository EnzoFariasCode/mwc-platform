"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";
import { ProposalStatus, UserType } from "@prisma/client";
import { compareTechProposalPriority } from "@/modules/subscriptions/tech-plan-ranking";

type ProposalListItem = {
  id: string;
  price: number;
  estimatedDays: number;
  coverLetter: string;
  status: ProposalStatus;
  projectId: string;
  professionalId: string;
  createdAt: Date;
  updatedAt: Date;
  professional: {
    id: string;
    name: string | null;
    rating: number;
    ratingCount: number;
    userType: UserType;
  };
};

export async function getProjectProposals(
  projectId: string
): Promise<ActionResponse<ProposalListItem[]>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Contas administrativas nao possuem propostas de cliente.",
      };
    }

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
            professionalPlanTier: true,
            stripeSubscriptionStatus: true,
            // avatarUrl: true, // Se tiver campo de foto, adicione aqui (ou delete se não tiver)
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    proposals.sort((first, second) =>
      compareTechProposalPriority(
        {
          ...first.professional,
          createdAt: first.createdAt,
        },
        {
          ...second.professional,
          createdAt: second.createdAt,
        },
      ),
    );

    const safeProposals = proposals.map(({ professional, ...proposal }) => ({
      ...proposal,
      professional: {
        id: professional.id,
        name: professional.name,
        rating: professional.rating,
        ratingCount: professional.ratingCount,
        userType: professional.userType,
      },
      price: proposal.price.toNumber(),
    }));

    return { success: true, data: safeProposals };
  } catch (error) {
    console.error("Erro ao buscar propostas:", error);
    return { success: false, error: "Erro interno." };
  }
}
