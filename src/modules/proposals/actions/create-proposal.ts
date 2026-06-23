"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getTechProjectLimitStatus } from "@/modules/subscriptions/tech-plan-limits";
import { ActionResponse } from "@/modules/users/types/user-types";
import { revalidatePath } from "next/cache";

interface CreateProposalData {
  projectId: string;
  price: number;
  days: number;
  coverLetter: string;
}

export async function createProposal(
  data: CreateProposalData,
): Promise<ActionResponse<{ code?: string; upgradeUrl?: string }>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Voce precisa estar logado." };
    }

    if (session?.userType !== "PROFESSIONAL" || session?.industry !== "TECH") {
      return {
        success: false,
        error: "Acao restrita a profissionais de Tecnologia.",
      };
    }

    const limitStatus = await getTechProjectLimitStatus(db, userId);

    if (!limitStatus.allowed) {
      return {
        success: false,
        error:
          limitStatus.reason ||
          "Seu plano atingiu o limite de trabalhos simultaneos.",
        data: {
          code: "PLAN_LIMIT_REACHED",
          upgradeUrl: "/dashboard/profissional?openPlans=true",
        },
      };
    }

    const project = await db.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.status !== "OPEN") {
      return {
        success: false,
        error: "Este projeto nao esta mais aceitando propostas.",
      };
    }

    const existingProposal = await db.proposal.findFirst({
      where: {
        projectId: data.projectId,
        professionalId: userId,
      },
    });

    if (existingProposal) {
      return {
        success: false,
        error: "Voce ja enviou uma proposta para este projeto.",
      };
    }

    const proposal = await db.proposal.create({
      data: {
        projectId: data.projectId,
        professionalId: userId,
        price: data.price,
        estimatedDays: data.days,
        coverLetter: data.coverLetter,
        status: "PENDING",
      },
    });

    await db.project.update({
      where: { id: data.projectId },
      data: { bidsCount: { increment: 1 } },
    });

    await upsertNotification({
      userId: project.ownerId,
      actorId: userId,
      type: "INFO",
      eventType: "TECH_PROPOSAL_RECEIVED",
      title: "Nova proposta recebida",
      message: `Seu projeto "${project.title}" recebeu uma nova proposta.`,
      link: "/dashboard/meus-projetos",
      entityType: "TECH_PROJECT",
      entityId: project.id,
      metadata: {
        proposalId: proposal.id,
        professionalId: userId,
        price: data.price,
      },
    });

    revalidatePath(`/dashboard/encontrar-projetos/${data.projectId}`);
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return { success: false, error: "Erro interno ao enviar proposta." };
  }
}
