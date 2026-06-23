import "server-only";

import { getTechPlanLimits } from "@/modules/subscriptions/tech-plan";
import {
  Prisma,
  ProjectCheckoutHoldStatus,
  ProjectStatus,
  ProposalStatus,
} from "@prisma/client";

type LimitClient = Pick<
  Prisma.TransactionClient,
  "project" | "projectCheckoutHold" | "proposal" | "user"
>;

export const OCCUPIED_TECH_PROJECT_STATUSES = [
  ProjectStatus.WAITING_PAYMENT,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.UNDER_REVIEW,
  ProjectStatus.DISPUTE,
] as const;

export type TechProjectLimitStatus = {
  allowed: boolean;
  occupiedSlots: number;
  remainingSlots: number;
  maxActiveProjects: number;
  planLabel: string;
  reason?: string;
};

type LimitOptions = {
  excludeProjectId?: string;
};

export async function getTechProjectLimitStatus(
  client: LimitClient,
  professionalId: string,
  options: LimitOptions = {},
): Promise<TechProjectLimitStatus> {
  const professional = await client.user.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      isActive: true,
      userType: true,
      industry: true,
      stripeSubscriptionStatus: true,
      stripePriceId: true,
      professionalPlanTier: true,
    },
  });

  if (!professional) {
    return {
      allowed: false,
      occupiedSlots: 0,
      remainingSlots: 0,
      maxActiveProjects: 0,
      planLabel: "Free",
      reason: "Profissional nao encontrado.",
    };
  }

  const planLimits = getTechPlanLimits(professional);

  if (
    !professional.isActive ||
    professional.userType !== "PROFESSIONAL" ||
    professional.industry !== "TECH"
  ) {
    return {
      allowed: false,
      occupiedSlots: 0,
      remainingSlots: 0,
      maxActiveProjects: planLimits.maxActiveProjects,
      planLabel: planLimits.label,
      reason: "Profissional Tech indisponivel para novos trabalhos.",
    };
  }

  const activeProjects = await client.project.findMany({
    where: {
      professionalId,
      ...(options.excludeProjectId
        ? { id: { not: options.excludeProjectId } }
        : {}),
      status: { in: [...OCCUPIED_TECH_PROJECT_STATUSES] },
    },
    select: { id: true },
  });

  const candidateHeldProposals = await client.proposal.findMany({
    where: {
      professionalId,
      status: { in: [ProposalStatus.PENDING, ProposalStatus.ACCEPTED] },
      project: {
        status: { in: [ProjectStatus.OPEN, ProjectStatus.WAITING_PAYMENT] },
      },
      ...(options.excludeProjectId
        ? { projectId: { not: options.excludeProjectId } }
        : {}),
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  const proposalProjectById = new Map(
    candidateHeldProposals.map((proposal) => [proposal.id, proposal.projectId]),
  );
  const candidateProposalIds = candidateHeldProposals.map(
    (proposal) => proposal.id,
  );
  const activeHolds = candidateProposalIds.length
    ? await client.projectCheckoutHold.findMany({
        where: {
          proposalId: { in: candidateProposalIds },
          status: ProjectCheckoutHoldStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        select: { proposalId: true },
      })
    : [];

  const occupiedProjectIds = new Set<string>([
    ...activeProjects.map((project) => project.id),
    ...activeHolds.flatMap((hold) => {
      const projectId = proposalProjectById.get(hold.proposalId);
      return projectId ? [projectId] : [];
    }),
  ]);
  const occupiedSlots = occupiedProjectIds.size;
  const remainingSlots = Math.max(
    planLimits.maxActiveProjects - occupiedSlots,
    0,
  );
  const allowed = occupiedSlots < planLimits.maxActiveProjects;

  return {
    allowed,
    occupiedSlots,
    remainingSlots,
    maxActiveProjects: planLimits.maxActiveProjects,
    planLabel: planLimits.label,
    reason: allowed
      ? undefined
      : `Seu plano ${planLimits.label} permite ate ${planLimits.maxActiveProjects} trabalho(s) simultaneo(s). Finalize um projeto ativo ou atualize seu plano para assumir novos trabalhos.`,
  };
}
