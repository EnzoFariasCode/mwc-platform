"use server";

import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { ProjectCheckoutHoldStatus } from "@prisma/client";
import { consumeRateLimit } from "@/lib/action-rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});
const CHECKOUT_USER_LIMIT = 8;
const CHECKOUT_PROPOSAL_LIMIT = 4;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

export async function createProjectCheckout(
  proposalId: string,
): Promise<ActionResponse<{ url: string }>> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado. Faca login novamente." };
  }

  if (session.userType !== "CLIENT") {
    return { success: false, error: "Ação restrita a clientes." };
  }

  const userLimitError = await consumeRateLimit({
    key: `finance:checkout:user:${session.id}`,
    limit: CHECKOUT_USER_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
    message: "Muitas tentativas de checkout. Aguarde alguns minutos.",
  });
  const proposalLimitError = await consumeRateLimit({
    key: `finance:checkout:proposal:${proposalId}`,
    limit: CHECKOUT_PROPOSAL_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
    message: "Muitas tentativas para esta proposta. Aguarde alguns minutos.",
  });

  if (userLimitError || proposalLimitError) {
    return {
      success: false,
      error: userLimitError || proposalLimitError || "Muitas tentativas.",
    };
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

  const now = new Date();

  await db.projectCheckoutHold.updateMany({
    where: {
      proposalId: proposal.id,
      buyerId: session.id,
      projectId: proposal.projectId,
      status: ProjectCheckoutHoldStatus.PENDING,
      expiresAt: { lte: now },
    },
    data: {
      status: ProjectCheckoutHoldStatus.EXPIRED,
      canceledAt: now,
    },
  });

  const activeHold = await db.projectCheckoutHold.findFirst({
    where: {
      proposalId: proposal.id,
      buyerId: session.id,
      projectId: proposal.projectId,
      status: ProjectCheckoutHoldStatus.PENDING,
      expiresAt: { gt: now },
      checkoutUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: { checkoutUrl: true },
  });

  if (activeHold?.checkoutUrl) {
    return { success: true, data: { url: activeHold.checkoutUrl } };
  }

  // 2. Validacao de preco (evita valores zerados quebrem a Stripe)
  const priceValue = proposal.price;
  if (priceValue.lessThanOrEqualTo(0)) {
    return {
      success: false,
      error: "O valor da proposta e invalido para pagamento.",
    };
  }
  const unitAmountInCents = priceValue
    .mul(100)
    .toDecimalPlaces(0)
    .toNumber();

  try {
    const hold = await db.projectCheckoutHold.create({
      data: {
        projectId: proposal.projectId,
        proposalId: proposal.id,
        buyerId: session.id,
        amount: proposal.price,
        currency: "brl",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

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
          holdId: hold.id,
          proposalId: proposal.id,
          buyerId: session.id,
          type: "project_payment",
        },
      },
      metadata: {
        holdId: hold.id,
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

    await db.projectCheckoutHold.update({
      where: { id: hold.id },
      data: {
        checkoutUrl: checkoutSession.url,
        stripeSessionId: checkoutSession.id,
        stripePaymentIntentId:
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id,
        expiresAt: checkoutSession.expires_at
          ? new Date(checkoutSession.expires_at * 1000)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error: any) {
    console.error("--- ERRO NA STRIPE ---");
    console.error("Motivo:", error.raw?.message || error.message);
    console.error("----------------------");

    await db.projectCheckoutHold.updateMany({
      where: {
        proposalId: proposal.id,
        buyerId: session.id,
        projectId: proposal.projectId,
        status: ProjectCheckoutHoldStatus.PENDING,
        stripeSessionId: null,
      },
      data: {
        status: ProjectCheckoutHoldStatus.FAILED,
        failedAt: new Date(),
        failureReason: error.raw?.message || error.message,
      },
    });

    return {
      success: false,
      error: "Erro ao conectar com o provedor de pagamento.",
    };
  }
}
