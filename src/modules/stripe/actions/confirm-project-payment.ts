"use server";

import Stripe from "stripe";
import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { finalizeProjectPayment } from "@/modules/stripe/lib/project-payment";
import { ActionResponse } from "@/modules/users/types/user-types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

async function validateCheckoutAmount(
  proposalId: string,
  amountInCents: number | null | undefined,
  currency: string | null | undefined
) {
  if (!proposalId) {
    return { ok: false, error: "Pagamento invalido." };
  }

  if (!amountInCents || amountInCents <= 0) {
    return { ok: false, error: "Pagamento invalido." };
  }

  if (!currency || currency.toLowerCase() !== "brl") {
    return { ok: false, error: "Pagamento invalido." };
  }

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: { price: true },
  });

  if (!proposal) {
    return { ok: false, error: "Pagamento invalido." };
  }

  const expectedCents = proposal.price
    .mul(100)
    .toDecimalPlaces(0)
    .toNumber();

  if (amountInCents !== expectedCents) {
    return { ok: false, error: "Pagamento invalido." };
  }

  return { ok: true };
}

export async function confirmProjectPayment(
  sessionId: string
): Promise<ActionResponse> {
  const session = await verifySession();
  const userId = session?.sub as string;

  if (!userId) {
    return { success: false, error: "Nao autorizado." };
  }

  if (!sessionId) {
    return { success: false, error: "Session invalida." };
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (checkoutSession.payment_status !== "paid") {
    return { success: false, error: "Pagamento ainda nao confirmado." };
  }

  const proposalId = checkoutSession.metadata?.proposalId;
  const buyerId = checkoutSession.metadata?.buyerId;

  if (!proposalId || !buyerId) {
    return { success: false, error: "Pagamento invalido." };
  }

  if (buyerId !== userId) {
    return { success: false, error: "Nao autorizado." };
  }

  const amountValidation = await validateCheckoutAmount(
    proposalId,
    checkoutSession.amount_total ?? undefined,
    checkoutSession.currency ?? undefined
  );

  if (!amountValidation.ok) {
    return { success: false, error: "Pagamento invalido." };
  }

  const result = await finalizeProjectPayment({
    proposalId,
    buyerId,
    source: "confirm",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
