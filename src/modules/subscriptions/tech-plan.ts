export type TechPlanId = "free" | "starter" | "advanced";

type PlanInput = {
  stripeSubscriptionStatus?: string | null;
  stripePriceId?: string | null;
  professionalPlanTier?: number | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export const TECH_PLAN_LIMITS: Record<
  TechPlanId,
  { tier: number; maxActiveProjects: number; label: string }
> = {
  free: { tier: 0, maxActiveProjects: 1, label: "Free" },
  starter: { tier: 1, maxActiveProjects: 3, label: "Starter" },
  advanced: { tier: 2, maxActiveProjects: 5, label: "Advanced" },
};

export function isActiveTechSubscription(status?: string | null) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status ?? "");
}

export function getTechPlanId(input: PlanInput): TechPlanId {
  if (!isActiveTechSubscription(input.stripeSubscriptionStatus)) {
    return "free";
  }

  if (
    process.env.STRIPE_PRICE_ADVANCED_ID &&
    input.stripePriceId === process.env.STRIPE_PRICE_ADVANCED_ID
  ) {
    return "advanced";
  }

  if (
    process.env.STRIPE_PRICE_STARTER_ID &&
    input.stripePriceId === process.env.STRIPE_PRICE_STARTER_ID
  ) {
    return "starter";
  }

  console.error("[TECH_PLAN_UNKNOWN_PRICE_ID]", {
    stripeSubscriptionStatus: input.stripeSubscriptionStatus,
    stripePriceId: input.stripePriceId,
    professionalPlanTier: input.professionalPlanTier,
  });

  return "free";
}

export function getTechPlanTier(input: PlanInput) {
  return TECH_PLAN_LIMITS[getTechPlanId(input)].tier;
}

export function getTechPlanLimits(input: PlanInput) {
  return TECH_PLAN_LIMITS[getTechPlanId(input)];
}
