/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";
import { finalizeProjectPayment } from "@/modules/stripe/lib/project-payment";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// --- Funções Auxiliares de Validação ---

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

// --- LOGICA DE SAÚDE (ATUALIZADA) ---

async function handleHealthAppointment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata || metadata.type !== "HEALTH_APPOINTMENT") {
    return new NextResponse("Invalid metadata", { status: 400 });
  }

  const { proId, patientId, date, time, holdId } = metadata;

  // Gera ShortID único (Ex: MWC-A8F9)
  const randomStr = crypto.randomBytes(2).toString("hex").toUpperCase();
  const shortId = `MWC-${randomStr}`;

  try {
    await db.$transaction(async (tx) => {
      // 1. Cria o agendamento real
      await tx.appointment.create({
        data: {
          shortId,
          date: new Date(date), // Formato 'YYYY-MM-DD'
          time: time,
          status: "PAID",
          price: session.amount_total ? session.amount_total / 100 : 0,
          stripeSessionId: session.id,
          patientId: patientId,
          professionalId: proId,
        },
      });

      // 2. Remove o HOLD temporário (Reserva atômica concluída)
      if (holdId) {
        await tx.appointmentHold.deleteMany({
          where: { id: holdId },
        });
      }
    });

    console.log(`✅ Consulta ${shortId} confirmada via Webhook.`);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("❌ Erro Webhook Health (Transação):", error);
    return new NextResponse("Transaction Error", { status: 500 });
  }
}

// --- ROTA POST PRINCIPAL ---

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ROTA SAUDE
        if (session.metadata?.type === "HEALTH_APPOINTMENT") {
          return await handleHealthAppointment(session);
        }

        // ROTA PROJETOS
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

        // ROTA ASSINATURAS (PRO)
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
        return new NextResponse(null, { status: 200 });
      }

      // ... manter os outros cases (payment_intent.succeeded, invoice, etc.) exatamente como estão
      default:
        return new NextResponse(null, { status: 200 });
    }
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
