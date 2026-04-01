/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeProjectPayment } from "@/modules/stripe/lib/project-payment";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function validateProjectPaymentAmount(
  proposalId: string,
  amountInCents: number | null | undefined,
  currency: string | null | undefined,
) {
  if (!proposalId) {
    return { ok: false, error: "Missing proposalId" };
  }

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

  if (!proposal) {
    return { ok: false, error: "Proposal not found" };
  }

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

  if (buyerId && proposal.project.ownerId !== buyerId) {
    return;
  }

  if (proposal.project.status !== "WAITING_PAYMENT") return;
  if (proposal.status !== "PENDING") return;

  await db.project.update({
    where: { id: proposal.projectId },
    data: { status: "OPEN" },
  });
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

    if (result.alreadyProcessed) {
      console.log("Webhook: Payment already processed.");
      return;
    }

    console.log(
      `Project payment processed successfully for proposal ${proposalId}.`,
    );
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "project_payment") {
          const amountValidation = await validateProjectPaymentAmount(
            session.metadata.proposalId,
            session.amount_total ?? undefined,
            session.currency ?? undefined,
          );

          if (!amountValidation.ok) {
            console.error(
              "Webhook: Invalid project payment amount.",
              amountValidation.error,
            );
            return new NextResponse("Invalid payment amount", { status: 400 });
          }

          await handleProjectPayment(
            session.metadata.proposalId,
            session.metadata.buyerId,
          );
          return new NextResponse(null, { status: 200 });
        }

        if (session.mode === "subscription") {
          if (!session?.metadata?.userId) {
            console.error("Webhook: Missing userId in subscription metadata.");
            break;
          }

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
          console.log(`User ${session.metadata.userId} is now PRO.`);
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

        return new NextResponse(null, { status: 200 });
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata?.type === "project_payment") {
          const amount = paymentIntent.amount_received || paymentIntent.amount;
          const amountValidation = await validateProjectPaymentAmount(
            paymentIntent.metadata.proposalId,
            amount ?? undefined,
            paymentIntent.currency ?? undefined,
          );

          if (!amountValidation.ok) {
            console.error(
              "Webhook: Invalid project payment amount (payment_intent).",
              amountValidation.error,
            );
            return new NextResponse("Invalid payment amount", { status: 400 });
          }

          await handleProjectPayment(
            paymentIntent.metadata.proposalId,
            paymentIntent.metadata.buyerId,
          );
        }
        return new NextResponse(null, { status: 200 });
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;

        if (!subId) break;

        const subDetails = (await stripe.subscriptions.retrieve(
          subId as string,
        )) as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subId as string },
          data: {
            stripePriceId: subDetails.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              (subDetails as any).current_period_end * 1000,
            ),
            stripeSubscriptionStatus: subDetails.status,
          },
        });
        console.log(`Subscription ${subId} renewed successfully.`);
        return new NextResponse(null, { status: 200 });
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;

        if (!subId) break;

        await db.user.update({
          where: { stripeSubscriptionId: subId as string },
          data: {
            stripeSubscriptionStatus: "past_due",
          },
        });
        console.log(`Subscription payment failed for ${subId}.`);
        return new NextResponse(null, { status: 200 });
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const subDetails = (await stripe.subscriptions.retrieve(
          subscription.id as string,
        )) as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionStatus: subDetails.status,
            stripeCurrentPeriodEnd: new Date(
              ((subDetails as any).current_period_end ?? 0) * 1000,
            ),
          },
        });
        console.log(
          `Subscription ${subscription.id} status updated to: ${subDetails.status}`,
        );
        return new NextResponse(null, { status: 200 });
      }
    }
  } catch (error) {
    console.error("Erro ao processar webhook no banco:", error);
    return new NextResponse("Database Error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
