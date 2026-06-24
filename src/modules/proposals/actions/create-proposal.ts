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

const PROPOSAL_PRICE_MIN = 10;
const PROPOSAL_PRICE_MAX = 1_000_000;
const PROPOSAL_DAYS_MIN = 1;
const PROPOSAL_DAYS_MAX = 365;
const COVER_LETTER_MIN = 20;
const COVER_LETTER_MAX = 3000;

function normalizeCoverLetter(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

    const price = Number(data.price);
    const days = Number(data.days);
    const coverLetter = normalizeCoverLetter(data.coverLetter);

    if (
      !Number.isFinite(price) ||
      price < PROPOSAL_PRICE_MIN ||
      price > PROPOSAL_PRICE_MAX
    ) {
      return { success: false, error: "Informe um valor de proposta valido." };
    }

    if (
      !Number.isInteger(days) ||
      days < PROPOSAL_DAYS_MIN ||
      days > PROPOSAL_DAYS_MAX
    ) {
      return { success: false, error: "Informe um prazo valido." };
    }

    if (
      coverLetter.length < COVER_LETTER_MIN ||
      coverLetter.length > COVER_LETTER_MAX
    ) {
      return {
        success: false,
        error: "Informe uma mensagem de proposta valida.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.ownerId === userId) {
      return {
        success: false,
        error: "Voce nao pode enviar proposta para um projeto criado por voce.",
      };
    }

    if (project.status !== "OPEN") {
      return {
        success: false,
        error: "Este projeto nao esta mais aceitando propostas.",
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
        price,
        estimatedDays: days,
        coverLetter,
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
        price,
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
