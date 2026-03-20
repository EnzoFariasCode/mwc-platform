"use server";

import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function createProjectCheckout(
  proposalId: string
): Promise<ActionResponse<{ url: string }>> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado. Faca login novamente." };
  }

  // Buscando o e-mail real do usuario no banco
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
    return { success: false, error: "Proposta nao encontrada." };
  }

  if (proposal.project.ownerId !== session.id) {
    return { success: false, error: "Voce nao pode pagar este projeto." };
  }

  if (proposal.status !== "PENDING") {
    return {
      success: false,
      error: "Proposta nao esta disponivel para pagamento.",
    };
  }

  if (!["OPEN", "WAITING_PAYMENT"].includes(proposal.project.status)) {
    return { success: false, error: "Projeto nao esta aberto para pagamento." };
  }

  // 2. Validacao de preco (evita valores zerados quebrem a Stripe)
  const priceValue = Number(proposal.price);
  if (isNaN(priceValue) || priceValue <= 0) {
    return {
      success: false,
      error: "O valor da proposta e invalido para pagamento.",
    };
  }
  const unitAmountInCents = Math.floor(priceValue * 100);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",

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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meus-projetos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout/${proposalId}?canceled=true`,
    });

    if (!checkoutSession.url) {
      throw new Error("Falha ao gerar URL.");
    }

    if (proposal.project.status === "OPEN") {
      await db.project.update({
        where: { id: proposal.projectId },
        data: { status: "WAITING_PAYMENT" },
      });
    }

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error: any) {
    console.error("--- ERRO NA STRIPE ---");
    console.error("Motivo:", error.raw?.message || error.message);
    console.error("----------------------");

    return {
      success: false,
      error: "Erro ao conectar com o provedor de pagamento.",
    };
  }
}
