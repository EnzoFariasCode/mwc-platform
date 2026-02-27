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

  // Buscando o e-mail real do usuário no banco
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

  // 2. Validação de Preço (Evita que valores zerados quebrem a Stripe)
  const priceValue = Number(proposal.price);
  if (isNaN(priceValue) || priceValue <= 0) {
    return { error: "O valor da proposta é inválido para pagamento." };
  }
  const unitAmountInCents = Math.floor(priceValue * 100);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",

      // Sem forçar métodos específicos ou automáticos aqui.
      // O Stripe vai assumir o modo padrão e mostrar o que estiver habilitado no seu painel.

      customer_email: user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: unitAmountInCents,
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
  } catch (error: any) {
    // 🔍 SE DER ERRO, VAI MOSTRAR EXATAMENTE O MOTIVO NO SEU TERMINAL DO VS CODE
    console.error("--- ERRO NA STRIPE ---");
    console.error("Motivo:", error.raw?.message || error.message);
    console.error("----------------------");

    return { error: "Erro ao conectar com o provedor de pagamento." };
  }
}
