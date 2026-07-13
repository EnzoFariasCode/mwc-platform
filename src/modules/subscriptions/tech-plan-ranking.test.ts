import { describe, expect, it } from "vitest";
import {
  buildTechProfessionalOrderBy,
  compareTechProposalPriority,
  getEffectiveTechPlanPriority,
} from "./tech-plan-ranking";

describe("tech plan ranking", () => {
  it("orders proposals as Advanced, Starter and Free", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const proposals = [
      {
        id: "free",
        professionalPlanTier: 0,
        stripeSubscriptionStatus: null,
        rating: 5,
        ratingCount: 100,
        createdAt,
      },
      {
        id: "starter",
        professionalPlanTier: 1,
        stripeSubscriptionStatus: "active",
        rating: 4,
        ratingCount: 1,
        createdAt,
      },
      {
        id: "advanced",
        professionalPlanTier: 2,
        stripeSubscriptionStatus: "active",
        rating: 3,
        ratingCount: 0,
        createdAt,
      },
    ];

    proposals.sort(compareTechProposalPriority);
    expect(proposals.map((proposal) => proposal.id)).toEqual([
      "advanced",
      "starter",
      "free",
    ]);
  });

  it("treats an inactive paid tier as Free", () => {
    expect(
      getEffectiveTechPlanPriority({
        professionalPlanTier: 2,
        stripeSubscriptionStatus: "canceled",
      }),
    ).toBe(0);
  });

  it.each(["relevancia", "menor_preco", "avaliacao", "experiencia"] as const)(
    "keeps plan priority as the first search order for %s",
    (sortBy) => {
      expect(buildTechProfessionalOrderBy(sortBy)[0]).toEqual({
        professionalPlanTier: "desc",
      });
    },
  );
});
