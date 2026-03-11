import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "project_payment") {
          const proposalId = session.metadata.proposalId;
          const buyerId = session.metadata.buyerId;

          if (!proposalId || !buyerId) {
            console.error("Webhook: Missing proposalId or buyerId.");
            break;
          }

          const proposal = await db.proposal.findUnique({
            where: { id: proposalId },
            include: { project: true },
          });

          if (!proposal) {
            console.error("Webhook: Proposal not found.");
            break;
          }

          if (proposal.project.ownerId !== buyerId) {
            console.error("Webhook: Buyer does not own the project.");
            break;
          }

          if (
            proposal.status !== "PENDING" ||
            proposal.project.status !== "OPEN"
          ) {
            console.log("Webhook: Payment already processed or invalid state.");
            break;
          }

          await db.$transaction([
            db.proposal.update({
              where: { id: proposalId },
              data: { status: "ACCEPTED" },
            }),

            db.proposal.updateMany({
              where: {
                projectId: proposal.projectId,
                id: { not: proposalId },
              },
              data: { status: "REJECTED" },
            }),

            db.project.update({
              where: { id: proposal.projectId },
              data: {
                status: "IN_PROGRESS",
                professionalId: proposal.professionalId,
                agreedPrice: proposal.price,
                deadline: new Date(
                  Date.now() + proposal.estimatedDays * 24 * 60 * 60 * 1000
                ).toLocaleDateString("pt-BR"),
              },
            }),

            db.transaction.create({
              data: {
                userId: proposal.project.ownerId,
                amount: Number(proposal.price),
                type: "DEBIT",
                status: "COMPLETED",
                description: `Pagamento retido (Escrow) - Projeto: ${proposal.project.title}`,
                projectId: proposal.projectId,
              },
            }),
          ]);
          console.log(
            `Project ${proposal.projectId} started successfully via Stripe.`
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
