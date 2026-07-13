import type { Prisma } from "@prisma/client";
import { isActiveTechSubscription } from "./tech-plan";

type TechPlanPriorityInput = {
  professionalPlanTier?: number | null;
  stripeSubscriptionStatus?: string | null;
};

type ProposalPriorityInput = TechPlanPriorityInput & {
  rating: number;
  ratingCount: number;
  createdAt: Date;
};

export type TechProfessionalSort =
  | "relevancia"
  | "menor_preco"
  | "avaliacao"
  | "experiencia";

export function getEffectiveTechPlanPriority(
  professional: TechPlanPriorityInput,
) {
  if (!isActiveTechSubscription(professional.stripeSubscriptionStatus)) {
    return 0;
  }

  return Math.min(2, Math.max(0, professional.professionalPlanTier ?? 0));
}

export function compareTechProposalPriority(
  first: ProposalPriorityInput,
  second: ProposalPriorityInput,
) {
  const planDifference =
    getEffectiveTechPlanPriority(second) -
    getEffectiveTechPlanPriority(first);
  if (planDifference !== 0) return planDifference;

  const ratingCountDifference = second.ratingCount - first.ratingCount;
  if (ratingCountDifference !== 0) return ratingCountDifference;

  const ratingDifference = second.rating - first.rating;
  if (ratingDifference !== 0) return ratingDifference;

  return first.createdAt.getTime() - second.createdAt.getTime();
}

export function buildTechProfessionalOrderBy(
  sortBy: TechProfessionalSort,
): Prisma.UserOrderByWithRelationInput[] {
  const planPriority: Prisma.UserOrderByWithRelationInput = {
    professionalPlanTier: "desc",
  };

  switch (sortBy) {
    case "menor_preco":
      return [planPriority, { hourlyRate: "asc" }, { rating: "desc" }];
    case "avaliacao":
      return [
        planPriority,
        { ratingCount: "desc" },
        { rating: "desc" },
      ];
    case "experiencia":
      return [
        planPriority,
        { yearsOfExperience: "desc" },
        { ratingCount: "desc" },
        { rating: "desc" },
      ];
    default:
      return [
        planPriority,
        { ratingCount: "desc" },
        { rating: "desc" },
      ];
  }
}
