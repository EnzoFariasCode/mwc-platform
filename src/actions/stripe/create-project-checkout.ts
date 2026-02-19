"use server";

import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function createProjectCheckout(proposalId: string) {
  const session = await getUserSession();

  if (!session?.id) {
    return { error: "Não autorizado. Faça login novamente." };
  }

  // Buscando o e-mail real do usuário no banco ---
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  // 1. Busca a proposta com os detalhes
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: true,
      professional: true,
    },
  });

  if (!proposal) {
    return { error: "Proposta não encontrada." };
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "pix"],
      // Passando o e-mail correto que veio do banco
      customer_email: user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(Number(proposal.price) * 100),
            product_data: {
              name: `Projeto: ${proposal.project.title}`,
              description: `Profissional: ${proposal.professional.name || "Profissional MWC"}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          proposalId: proposal.id,
          buyerId: session.id,
          type: "project_payment",
        },
      },
      metadata: {
        proposalId: proposal.id,
        buyerId: session.id,
        type: "project_payment",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meus-projetos?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout/${proposalId}`,
    });

    if (!checkoutSession.url) {
      throw new Error("Falha ao gerar URL.");
    }

    return { url: checkoutSession.url };
  } catch (error) {
    console.error("Erro Stripe Project:", error);
    return { error: "Erro ao conectar com o provedor de pagamento." };
  }
}
