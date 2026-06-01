/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";
import { finalizeProjectPayment } from "@/modules/stripe/lib/project-payment";
import { finalizeHealthAppointmentPayment } from "@/modules/health/actions/appointment-payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function validateProjectPaymentAmount(
  proposalId: string,
  amountInCents: number | null | undefined,
  currency: string | null | undefined,
) {
  if (!proposalId) return { ok: false, error: "Missing proposalId" };
  if (!amountInCents || amountInCents <= 0) {
    return { ok: false, error: "Missing or invalid amount" };
  }
  if (!currency || currency.toLowerCase() !== "brl") {
    return { ok: false, error: "Invalid currency" };
  }

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: { price: true },
  });

  if (!proposal) return { ok: false, error: "Proposal not found" };

  const expectedCents = proposal.price.mul(100).toDecimalPlaces(0).toNumber();
  if (amountInCents !== expectedCents) {
    return {
      ok: false,
      error: `Amount mismatch. Expected ${expectedCents}, got ${amountInCents}`,
    };
  }

  return { ok: true };
}

async function reopenProjectOnCheckoutExpired(
  proposalId: string,
  buyerId?: string | null,
) {
  if (!proposalId) return;

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: {
      status: true,
      projectId: true,
      project: { select: { status: true, ownerId: true } },
    },
  });

  if (!proposal) return;
  if (buyerId && proposal.project.ownerId !== buyerId) return;
  if (proposal.project.status !== "WAITING_PAYMENT") return;
  if (proposal.status !== "PENDING") return;

  await db.project.update({
    where: { id: proposal.projectId },
    data: { status: "OPEN" },
  });
}

async function handleHealthAppointment(session: Stripe.Checkout.Session) {
  console.log("[WEBHOOK_HEALTH] Processing health appointment payment:", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amount: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
  });

  const result = await finalizeHealthAppointmentPayment({ session });

  if (!result.success) {
    console.error("[WEBHOOK_HEALTH] Health appointment finalization failed:", {
      error: result.error,
      sessionId: session.id,
      metadata: session.metadata,
    });
    return new NextResponse(result.error ?? "Health appointment error", {
      status: 400,
    });
  }

  console.log("[WEBHOOK_HEALTH] Health appointment created successfully:", {
    appointmentId: result.appointmentId,
    professionalId: result.professionalId,
    sessionId: session.id,
  });

  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or secret");
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const handleProjectPayment = async (proposalId: string, buyerId: string) => {
    const result = await finalizeProjectPayment({
      proposalId,
      buyerId,
      source: "webhook",
    });

    if (!result.success) {
      console.error("Webhook: Payment processing failed.", result.error);
      return;
    }

    console.log(`Project payment processed for proposal ${proposalId}.`);
  };

  const handleHealthCheckoutExpired = async (
    session: Stripe.Checkout.Session,
  ) => {
    const holdId = session.metadata?.holdId;
    const stripeSessionId = session.id;

    await db.appointmentHold.deleteMany({
      where: {
        OR: [
          holdId ? { id: holdId } : undefined,
          stripeSessionId ? { stripeSessionId } : undefined,
        ].filter(Boolean) as Array<Record<string, unknown>>,
      },
    });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "HEALTH_APPOINTMENT") {
          return await handleHealthAppointment(session);
        }

        if (session.metadata?.type === "project_payment") {
          const amountValidation = await validateProjectPaymentAmount(
            session.metadata.proposalId,
            session.amount_total ?? undefined,
            session.currency ?? undefined,
          );

          if (!amountValidation.ok) {
            return new NextResponse("Invalid payment amount", { status: 400 });
          }

          await handleProjectPayment(
            session.metadata.proposalId,
            session.metadata.buyerId,
          );
          return new NextResponse(null, { status: 200 });
        }

        if (session.mode === "subscription") {
          if (!session?.metadata?.userId) break;

          const subscriptionDetails = (await stripe.subscriptions.retrieve(
            session.subscription as string,
          )) as Stripe.Subscription;

          await db.user.update({
            where: { id: session.metadata.userId },
            data: {
              stripeSubscriptionId: subscriptionDetails.id,
              stripeCustomerId: subscriptionDetails.customer as string,
              stripePriceId: subscriptionDetails.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                ((subscriptionDetails as any).current_period_end ?? 0) * 1000,
              ),
              stripeSubscriptionStatus: subscriptionDetails.status,
            },
          });
        }

        return new NextResponse(null, { status: 200 });
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === "project_payment") {
          await reopenProjectOnCheckoutExpired(
            session.metadata.proposalId,
            session.metadata.buyerId,
          );
        }

        if (session.metadata?.type === "HEALTH_APPOINTMENT") {
          await handleHealthCheckoutExpired(session);
        }

        return new NextResponse(null, { status: 200 });
      }

      default:
        return new NextResponse(null, { status: 200 });
    }
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
