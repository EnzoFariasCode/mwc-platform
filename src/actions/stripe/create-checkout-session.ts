"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session"; // <--- Importe o helper
import { db } from "@/lib/prisma"; // <--- Para buscar o email real

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function createCheckoutSession(planType: "starter" | "advanced") {
  // 1. OBTER USUÁRIO REAL
  const session = await getUserSession();

  // SE NÃO TIVER LOGADO: Retorna erro específico "unauthorized"
  if (!session || !session.id) {
    return { error: "unauthorized" };
  }

  // 2. BUSCAR DADOS COMPLETOS NO BANCO (Precisamos do Email para o Stripe)
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  // 3. SELECIONAR PREÇO
  const priceId =
    planType === "starter"
      ? process.env.STRIPE_PRICE_STARTER
      : process.env.STRIPE_PRICE_ADVANCED;

  if (!priceId) {
    return { error: "Erro interno: Preço não configurado." };
  }

  try {
    // 4. CRIAR SESSÃO DE CHECKOUT
    // Se o usuário já tiver um stripeCustomerId no banco, usamos ele para não duplicar clientes no painel da Stripe
    const customerUpdate = user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : { customer_email: user.email };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.id,
        planType: planType,
      },
      // Lógica inteligente: Se já tem ID, usa ID. Se não, usa Email.
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/financeiro?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/beWorker?canceled=true`,
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe não retornou URL.");
    }

    return { url: checkoutSession.url };
  } catch (error) {
    console.error("Erro Stripe:", error);
    return { error: "Erro ao iniciar pagamento." };
  }
}
