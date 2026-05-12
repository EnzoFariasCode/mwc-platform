import "server-only";

import { db } from "@/lib/prisma";
import { ProjectStatus, ProposalStatus } from "@prisma/client";

type FinalizeProjectPaymentInput = {
  proposalId: string;
  buyerId: string;
  source: "webhook" | "confirm";
};

type FinalizeProjectPaymentResult =
  | { success: true; alreadyProcessed?: boolean }
  | { success: false; error: string };

export async function finalizeProjectPayment({
  proposalId,
  buyerId,
  source,
}: FinalizeProjectPaymentInput): Promise<FinalizeProjectPaymentResult> {
  if (!proposalId || !buyerId) {
    return { success: false, error: "Dados de pagamento invalidos." };
  }

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { project: true },
  });

  if (!proposal) {
    return { success: false, error: "Proposta nao encontrada." };
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
      const updated = await tx.project.updateMany({
        where: {
          id: proposal.projectId,
          status: { in: [ProjectStatus.OPEN, ProjectStatus.WAITING_PAYMENT] },
        },
        data: {
          status: ProjectStatus.IN_PROGRESS,
          professionalId: proposal.professionalId,
          agreedPrice: proposal.price,
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

      await tx.transaction.create({
        data: {
          userId: proposal.project.ownerId,
          amount: proposal.price,
          type: "DEBIT",
          status: "COMPLETED",
          description: `Pagamento retido (Escrow) - Projeto: ${proposal.project.title} (${source})`,
          projectId: proposal.projectId,
        },
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error("Erro ao finalizar pagamento do projeto:", error);
    return { success: false, error: "Erro interno ao processar pagamento." };
  }
}
