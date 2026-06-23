"use server";

import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  getTechPlanTier,
  isActiveTechSubscription,
} from "@/modules/subscriptions/tech-plan";
import { ActionResponse } from "@/modules/users/types/user-types";

type PaidPlanId = "starter" | "advanced";

async function createBillingPortalUrl(customerId: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profissional`,
  });

  return portalSession.url;
}

async function findActiveCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return subscriptions.data.find((subscription) =>
    isActiveTechSubscription(subscription.status),
  );
}

export async function createCheckoutSession(
  planId: PaidPlanId,
): Promise<ActionResponse<{ url: string }>> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Voce precisa estar logado para assinar." };
  }

  if (session.userType !== "PROFESSIONAL" || session.industry !== "TECH") {
    return {
      success: false,
      error: "Acao restrita a profissionais de Tecnologia.",
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    return { success: false, error: "Usuario nao encontrado." };
  }

  if (isActiveTechSubscription(user.stripeSubscriptionStatus)) {
    if (!user.stripeCustomerId) {
      return {
        success: false,
        error: "Assinatura ativa encontrada, mas sem cliente Stripe vinculado.",
        data: { url: "/dashboard/profissional" },
      };
    }

    return {
      success: true,
      data: { url: await createBillingPortalUrl(user.stripeCustomerId) },
    };
  }

  if (user.stripeCustomerId) {
    const activeSubscription = await findActiveCustomerSubscription(
      user.stripeCustomerId,
    );

    if (activeSubscription) {
      const priceId = activeSubscription.items.data[0]?.price?.id ?? null;
      const currentPeriodEnd = (
        activeSubscription as { current_period_end?: number }
      ).current_period_end;

      await db.user.update({
        where: { id: user.id },
        data: {
          stripeSubscriptionId: activeSubscription.id,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
          stripeSubscriptionStatus: activeSubscription.status,
          professionalPlanTier: getTechPlanTier({
            stripeSubscriptionStatus: activeSubscription.status,
            stripePriceId: priceId,
          }),
        },
      });

      return {
        success: true,
        data: { url: await createBillingPortalUrl(user.stripeCustomerId) },
      };
    }
  }

  const prices: Record<PaidPlanId, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER_ID,
    advanced: process.env.STRIPE_PRICE_ADVANCED_ID,
  };

  const priceId = prices[planId];

  if (!priceId) {
    return { success: false, error: "Plano invalido ou nao configurado." };
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email!,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profissional?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/beWorker`,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    if (!checkoutSession.url) {
      throw new Error("Erro ao gerar URL do Stripe.");
    }

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error) {
    console.error("Erro Stripe:", error);
    return { success: false, error: "Erro ao iniciar o pagamento." };
  }
}
