"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getTechProjectLimitStatus } from "@/modules/subscriptions/tech-plan-limits";
import { ActionResponse } from "@/modules/users/types/user-types";
import { revalidatePath } from "next/cache";
import { enqueueTechEmail } from "@/modules/email/services/tech-email-service";

interface CreateProposalData {
  projectId: string;
  price: number;
  days: number;
  coverLetter: string;
}

const PROPOSAL_PRICE_MIN = 1;
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
      include: {
        owner: {
          select: { id: true, email: true, name: true, displayName: true },
        },
      },
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
      orderBy: { updatedAt: "desc" },
    });

    if (existingProposal && existingProposal.status !== "WITHDRAWN") {
      return {
        success: false,
        error: "Voce ja enviou uma proposta para este projeto.",
      };
    }

    const professional = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, displayName: true },
    });
    if (!professional) {
      return { success: false, error: "Profissional nao encontrado." };
    }

    const proposalEventAt = new Date();
    const proposal = await db.$transaction(async (tx) => {
      const storedProposal = existingProposal
        ? await (async () => {
          const reactivated = await tx.proposal.updateMany({
            where: {
              id: existingProposal.id,
              professionalId: userId,
              status: "WITHDRAWN",
              project: { status: "OPEN" },
            },
            data: {
              price,
              estimatedDays: days,
              coverLetter,
              status: "PENDING",
              updatedAt: proposalEventAt,
            },
          });

          if (reactivated.count !== 1) return null;

          const openProject = await tx.project.updateMany({
            where: { id: data.projectId, status: "OPEN" },
            data: { bidsCount: { increment: 1 } },
          });

          if (openProject.count !== 1) {
            throw new Error("PROJECT_NOT_OPEN");
          }

          return { id: existingProposal.id };
        })()
        : await (async () => {
          const openProject = await tx.project.updateMany({
            where: { id: data.projectId, status: "OPEN" },
            data: { bidsCount: { increment: 1 } },
          });

          if (openProject.count !== 1) {
            throw new Error("PROJECT_NOT_OPEN");
          }

          return tx.proposal.create({
            data: {
              projectId: data.projectId,
              professionalId: userId,
              price,
              estimatedDays: days,
              coverLetter,
              status: "PENDING",
            },
            select: { id: true },
          });
        })();

      if (!storedProposal) return null;

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
          proposalId: storedProposal.id,
          professionalId: userId,
          price,
        },
      }, tx);

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_PROPOSAL_RECEIVED:${storedProposal.id}:${project.ownerId}:${proposalEventAt.toISOString()}`,
        eventType: "TECH_PROPOSAL_RECEIVED",
        templateKey: "tech.proposal.received",
        recipient: project.owner,
        entityType: "TECH_PROJECT",
        entityId: project.id,
        content: {
          title: "Nova proposta recebida",
          preview: `Seu projeto ${project.title} recebeu uma proposta.`,
          lines: [
            `${professional.displayName || professional.name} enviou uma proposta para o seu projeto.`,
            "Compare o valor, o prazo e o perfil do profissional antes de decidir.",
          ],
          details: [
            { label: "Projeto", value: project.title },
            {
              label: "Valor proposto",
              value: price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            },
            { label: "Prazo", value: `${days} dias` },
          ],
          actionLabel: "Analisar proposta",
          actionPath: "/dashboard/meus-projetos",
        },
      });

      return storedProposal;
    });

    if (!proposal) {
      return {
        success: false,
        error: "A proposta mudou de status e nao pode ser reenviada.",
      };
    }

    revalidatePath(`/dashboard/encontrar-projetos/${data.projectId}`);
    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/minhas-propostas");

    return { success: true };
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return { success: false, error: "Erro interno ao enviar proposta." };
  }
}
