import "server-only";

import { unstable_cache } from "next/cache";
import Stripe from "stripe";

export type TechPaidPlanId = "starter" | "advanced";

export type TechPlanDisplayPrice = {
  price: string;
  period: string;
  source: "stripe" | "fallback";
};

export type TechPlanDisplayPrices = Record<TechPaidPlanId, TechPlanDisplayPrice>;

const FALLBACK_PRICES: TechPlanDisplayPrices = {
  starter: { price: "R$ 14,99", period: "/mês", source: "fallback" },
  advanced: { price: "R$ 24,99", period: "/mês", source: "fallback" },
};

const PLAN_PRICE_ENV: Record<TechPaidPlanId, string> = {
  starter: "STRIPE_PRICE_STARTER_ID",
  advanced: "STRIPE_PRICE_ADVANCED_ID",
};

function formatPrice(unitAmount: number | null, currency: string | null) {
  if (unitAmount === null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: (currency || "brl").toUpperCase(),
  }).format(unitAmount / 100);
}

function formatPeriod(price: Stripe.Price) {
  const interval = price.recurring?.interval;

  if (interval === "month") return "/mês";
  if (interval === "year") return "/ano";
  if (interval === "week") return "/semana";
  if (interval === "day") return "/dia";

  return "";
}

async function loadTechPlanDisplayPrices(): Promise<TechPlanDisplayPrices> {
  const prices = { ...FALLBACK_PRICES };

  if (!process.env.STRIPE_SECRET_KEY) {
    return prices;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
  });

  await Promise.all(
    (Object.keys(PLAN_PRICE_ENV) as TechPaidPlanId[]).map(async (planId) => {
      const priceId = process.env[PLAN_PRICE_ENV[planId]];
      if (!priceId) return;

      try {
        const stripePrice = await stripe.prices.retrieve(priceId);
        const formattedPrice = formatPrice(
          stripePrice.unit_amount,
          stripePrice.currency,
        );

        if (!formattedPrice) return;

        prices[planId] = {
          price: formattedPrice,
          period: formatPeriod(stripePrice),
          source: "stripe",
        };
      } catch (error) {
        console.error(`[TECH_PLAN_PRICE_ERROR:${planId}]`, error);
      }
    }),
  );

  return prices;
}

export const getTechPlanDisplayPrices = unstable_cache(
  loadTechPlanDisplayPrices,
  ["tech-plan-display-prices"],
  { revalidate: 60 * 60 },
);
