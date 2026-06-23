import "server-only";

import { db } from "@/lib/prisma";
import {
  Prisma,
  ProjectCheckoutHoldStatus,
  ProjectStatus,
  ProposalStatus,
} from "@prisma/client";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getTechPlanLimits } from "@/modules/subscriptions/tech-plan";

type FinalizeProjectPaymentInput = {
  proposalId: string;
  buyerId: string;
  source: "webhook" | "confirm";
  stripeSessionId?: string;
  stripePaymentIntentId?: string | null;
};

type FinalizeProjectPaymentResult =
  | { success: true; alreadyProcessed?: boolean }
  | { success: false; error: string; manualReviewRequired?: boolean };

const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.UNDER_REVIEW,
  ProjectStatus.DISPUTE,
];

export async function finalizeProjectPayment({
  proposalId,
  buyerId,
  source,
  stripeSessionId,
  stripePaymentIntentId,
}: FinalizeProjectPaymentInput): Promise<FinalizeProjectPaymentResult> {
  if (!proposalId || !buyerId) {
    return { success: false, error: "Dados de pagamento invalidos." };
  }

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: true,
      professional: {
        select: {
          stripeSubscriptionStatus: true,
          stripePriceId: true,
          professionalPlanTier: true,
        },
      },
    },
  });

  if (!proposal) {
    return { success: false, error: "Proposta nao encontrada." };
  }

  const checkoutHold = stripeSessionId
    ? await db.projectCheckoutHold.findUnique({
        where: { stripeSessionId },
        select: {
          id: true,
          projectId: true,
          proposalId: true,
          buyerId: true,
          amount: true,
          status: true,
          expiresAt: true,
        },
      })
    : null;

  if (stripeSessionId && !checkoutHold) {
    return { success: false, error: "Checkout pendente nao encontrado." };
  }

  if (checkoutHold) {
    if (
      checkoutHold.projectId !== proposal.projectId ||
      checkoutHold.proposalId !== proposalId ||
      checkoutHold.buyerId !== buyerId
    ) {
      return { success: false, error: "Checkout nao pertence ao projeto." };
    }

    if (checkoutHold.status === ProjectCheckoutHoldStatus.COMPLETED) {
      return { success: true, alreadyProcessed: true };
    }

    if (checkoutHold.status !== ProjectCheckoutHoldStatus.PENDING) {
      return { success: false, error: "Checkout nao esta pendente." };
    }

    if (checkoutHold.amount.comparedTo(proposal.price) !== 0) {
      return { success: false, error: "Valor do checkout divergente." };
    }
  }

  if (proposal.project.ownerId !== buyerId) {
    return { success: false, error: "Usuario nao e dono do projeto." };
  }

  if (
    proposal.status !== ProposalStatus.PENDING &&
    proposal.status !== ProposalStatus.ACCEPTED
  ) {
    return { success: false, error: "Proposta nao esta disponivel." };
  }

  if (
    proposal.project.status !== ProjectStatus.OPEN &&
    proposal.project.status !== ProjectStatus.WAITING_PAYMENT
  ) {
    if (
      proposal.status === ProposalStatus.ACCEPTED &&
      // 🛡️ CORREÇÃO 1: Avisando o TypeScript que isso é um Array de ProjectStatus
      (
        [
          ProjectStatus.IN_PROGRESS,
          ProjectStatus.UNDER_REVIEW,
          ProjectStatus.COMPLETED,
        ] as ProjectStatus[]
      ).includes(proposal.project.status)
    ) {
      return { success: true, alreadyProcessed: true };
    }
    return {
      success: false,
      error: "Projeto nao esta disponivel para pagamento.",
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const planLimits = getTechPlanLimits(proposal.professional);
      const activeProjectsCount = await tx.project.count({
        where: {
          professionalId: proposal.professionalId,
          id: { not: proposal.projectId },
          status: { in: ACTIVE_PROJECT_STATUSES },
        },
      });

      if (activeProjectsCount >= planLimits.maxActiveProjects) {
        const reason =
          "Profissional atingiu o limite de trabalhos simultaneos do plano no momento da confirmacao.";

        if (checkoutHold) {
          await tx.projectCheckoutHold.update({
            where: { id: checkoutHold.id },
            data: {
              status: ProjectCheckoutHoldStatus.FAILED,
              failedAt: new Date(),
              failureReason: reason,
              stripePaymentIntentId,
            },
          });
        }

        return {
          success: false,
          error:
            "O profissional atingiu o limite de trabalhos simultaneos do plano. O pagamento precisa de revisao pelo suporte.",
          manualReviewRequired: Boolean(stripeSessionId),
        } as FinalizeProjectPaymentResult;
      }

      const updated = await tx.project.updateMany({
        where: {
          id: proposal.projectId,
          status: { in: [ProjectStatus.OPEN, ProjectStatus.WAITING_PAYMENT] },
        },
        data: {
          status: ProjectStatus.IN_PROGRESS,
          professionalId: proposal.professionalId,
          agreedPrice: proposal.price,
          stripeSessionId,
          stripePaymentIntentId,
          deadline: new Date(
            Date.now() + proposal.estimatedDays * 24 * 60 * 60 * 1000,
          ).toLocaleDateString("pt-BR"),
        },
      });

      if (updated.count === 0) {
        const fresh = await tx.project.findUnique({
          where: { id: proposal.projectId },
          select: { status: true },
        });

        if (
          fresh?.status &&
          // 🛡️ CORREÇÃO 2: Mesma blindagem aqui embaixo
          (
            [
              ProjectStatus.IN_PROGRESS,
              ProjectStatus.UNDER_REVIEW,
              ProjectStatus.COMPLETED,
            ] as ProjectStatus[]
          ).includes(fresh.status)
        ) {
          return { success: true, alreadyProcessed: true };
        }

        return {
          success: false,
          error: "Estado invalido para confirmacao.",
        } as FinalizeProjectPaymentResult;
      }

      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: ProposalStatus.ACCEPTED },
      });

      await tx.proposal.updateMany({
        where: {
          projectId: proposal.projectId,
          id: { not: proposalId },
        },
        data: { status: ProposalStatus.REJECTED },
      });

      if (checkoutHold) {
        await tx.projectCheckoutHold.update({
          where: { id: checkoutHold.id },
          data: {
            status: ProjectCheckoutHoldStatus.COMPLETED,
            stripePaymentIntentId,
            completedAt: new Date(),
          },
        });

        await tx.projectCheckoutHold.updateMany({
          where: {
            projectId: proposal.projectId,
            id: { not: checkoutHold.id },
            status: ProjectCheckoutHoldStatus.PENDING,
          },
          data: {
            status: ProjectCheckoutHoldStatus.CANCELED,
            canceledAt: new Date(),
          },
        });
      }

      await tx.transaction.create({
        data: {
          userId: proposal.project.ownerId,
          amount: proposal.price,
          type: "DEBIT",
          status: "COMPLETED",
          description: `Pagamento retido (Escrow) - Projeto: ${proposal.project.title} (${source})${
            stripeSessionId ? ` - Stripe: ${stripeSessionId}` : ""
          }`,
          projectId: proposal.projectId,
        },
      });

      return { success: true };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    const finalResult = result as FinalizeProjectPaymentResult;

    if (finalResult.success && !finalResult.alreadyProcessed) {
      await upsertNotification({
        userId: proposal.professionalId,
        actorId: buyerId,
        type: "SUCCESS",
        eventType: "TECH_PROJECT_PAYMENT_CONFIRMED",
        title: "Pagamento confirmado",
        message: `O cliente pagou pelo projeto "${proposal.project.title}". Voce ja pode iniciar o trabalho.`,
        link: "/dashboard/projetos-ativos",
        entityType: "TECH_PROJECT",
        entityId: proposal.projectId,
        metadata: {
          proposalId,
          amount: proposal.price.toNumber(),
          stripeSessionId: stripeSessionId ?? null,
          source,
        },
      });
    }

    return finalResult;
  } catch (error) {
    console.error("Erro ao finalizar pagamento do projeto:", error);
    return { success: false, error: "Erro interno ao processar pagamento." };
  }
}
