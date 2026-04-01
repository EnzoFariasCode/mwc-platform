"use server";

import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function createCheckoutSession(
  planId: "starter" | "advanced",
): Promise<ActionResponse<{ url: string }>> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Você precisa estar logado para assinar." };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  // --- TRAVA DE SEGURANÇA ---
  // Se o usuário já tem assinatura ativa, impedimos novo checkout
  if (user.stripeSubscriptionStatus === "active") {
    // Opcional: Podemos retornar um código específico para o front redirecionar pro portal
    return {
      success: false,
      error: "Você já possui uma assinatura ativa.",
      data: { url: "/dashboard/profissional" },
    };
  }
  // --------------------------

  // Defina seus Price IDs aqui (igual ao UpgradeBanner)
  const prices = {
    starter: process.env.STRIPE_PRICE_STARTER_ID!, // ex: price_1Q...
    advanced: process.env.STRIPE_PRICE_ADVANCED_ID!, // ex: price_1Q...
  };

  const priceId = prices[planId];

  if (!priceId) {
    return { success: false, error: "Plano inválido ou não configurado." };
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user.stripeCustomerId || undefined, // Reusa o customer se existir
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
