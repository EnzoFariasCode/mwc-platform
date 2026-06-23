"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth"; // Certifique-se que o verifySession está sendo exportado do seu lib/auth
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getTechPlanLimits } from "@/modules/subscriptions/tech-plan";

// 👇 ESSA PARTE É OBRIGATÓRIA PARA O ERRO SUMIR
interface CreateProposalData {
  projectId: string;
  price: number;
  days: number;
  coverLetter: string;
}

export async function createProposal(
  data: CreateProposalData
): Promise<ActionResponse<{ code?: string; upgradeUrl?: string }>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Você precisa estar logado." };
    }

    if (
      session?.userType !== "PROFESSIONAL" ||
      session?.industry !== "TECH"
    ) {
      return {
        success: false,
        error: "Ação restrita a profissionais de Tecnologia.",
      };
    }

    // 1. Verifica se o usuário é Profissional
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
        stripeSubscriptionStatus: true,
        stripePriceId: true,
        professionalPlanTier: true,
      },
    });

    if (user?.userType !== "PROFESSIONAL") {
      return {
        success: false,
        error: "Apenas profissionais podem enviar propostas.",
      };
    }

    // 2. Verifica se o projeto existe e está ABERTO
    const planLimits = getTechPlanLimits(user);
    const activeProjectsCount = await db.project.count({
      where: {
        professionalId: userId,
        status: { in: ["IN_PROGRESS", "UNDER_REVIEW", "DISPUTE"] },
      },
    });

    if (activeProjectsCount >= planLimits.maxActiveProjects) {
      return {
        success: false,
        error: `Seu plano ${planLimits.label} permite ate ${planLimits.maxActiveProjects} trabalho(s) simultaneo(s). Finalize um projeto ativo ou atualize seu plano para enviar novas propostas.`,
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
      return { success: false, error: "Projeto não encontrado." };
    }

    if (project.status !== "OPEN") {
      return {
        success: false,
        error: "Este projeto não está mais aceitando propostas.",
      };
    }

    // 3. Verifica se já enviou proposta antes (Evitar duplicidade)
    const existingProposal = await db.proposal.findFirst({
      where: {
        projectId: data.projectId,
        professionalId: userId,
      },
    });

    if (existingProposal) {
      return {
        success: false,
        error: "Você já enviou uma proposta para este projeto.",
      };
    }

    // 4. Cria a Proposta
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

    // 5. Incrementa o contador
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
