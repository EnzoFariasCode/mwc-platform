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
      `Project payment processed successfully for proposal ${proposalId}.`
    );
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "project_payment") {
          await handleProjectPayment(
            session.metadata.proposalId,
            session.metadata.buyerId
          );
          break;
        }

        if (session.mode === "subscription") {
          if (!session?.metadata?.userId) {
            console.error("Webhook: Missing userId in subscription metadata.");
            break;
          }

          const subscriptionDetails = (await stripe.subscriptions.retrieve(
            session.subscription as string
          )) as Stripe.Subscription;

          await db.user.update({
            where: { id: session.metadata.userId },
            data: {
              stripeSubscriptionId: subscriptionDetails.id,
              stripeCustomerId: subscriptionDetails.customer as string,
              stripePriceId: subscriptionDetails.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                ((subscriptionDetails as any).current_period_end ?? 0) * 1000
              ),
              stripeSubscriptionStatus: subscriptionDetails.status,
            },
          });
          console.log(`User ${session.metadata.userId} is now PRO.`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata?.type === "project_payment") {
          await handleProjectPayment(
            paymentIntent.metadata.proposalId,
            paymentIntent.metadata.buyerId
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;

        if (!subId) break;

        const subDetails = (await stripe.subscriptions.retrieve(
          subId as string
        )) as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subId as string },
          data: {
            stripePriceId: subDetails.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              (subDetails as any).current_period_end * 1000
            ),
            stripeSubscriptionStatus: subDetails.status,
          },
        });
        console.log(`Subscription ${subId} renewed successfully.`);
        break;
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
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const subDetails = (await stripe.subscriptions.retrieve(
          subscription.id as string
        )) as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionStatus: subDetails.status,
            stripeCurrentPeriodEnd: new Date(
              ((subDetails as any).current_period_end ?? 0) * 1000
            ),
          },
        });
        console.log(
          `Subscription ${subscription.id} status updated to: ${subDetails.status}`
        );
        break;
      }
    }
  } catch (error) {
    console.error("Erro ao processar webhook no banco:", error);
    return new NextResponse("Database Error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
