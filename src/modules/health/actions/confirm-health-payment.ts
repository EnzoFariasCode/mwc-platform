"use server";

import Stripe from "stripe";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";
import { finalizeHealthAppointmentPayment } from "@/modules/health/actions/appointment-payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

export async function confirmHealthPayment(
  sessionId: string,
): Promise<ActionResponse> {
  const session = await verifySession();
  const userId = session?.sub as string | undefined;

  if (!userId) {
    return { success: false, error: "Nao autorizado." };
  }

  if (!sessionId) {
    return { success: false, error: "Session invalida." };
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  const result = await finalizeHealthAppointmentPayment({
    session: checkoutSession,
    expectedPatientId: userId,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
