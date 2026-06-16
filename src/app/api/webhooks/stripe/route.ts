/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";
import { finalizeProjectPayment } from "@/modules/stripe/lib/project-payment";
import { finalizeHealthAppointmentPayment } from "@/modules/health/actions/appointment-payment";
import { sendRefundProcessedEmail } from "@/modules/health/services/transactional-email-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function responseIsSuccess(response: NextResponse) {
  return response.status >= 200 && response.status < 300;
}

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function claimStripeEvent(event: Stripe.Event) {
  const existing = await db.stripeEventLog.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true, status: true },
  });

  if (existing?.status === "PROCESSED") {
    return false;
  }

  const now = new Date();

  if (existing) {
    await db.stripeEventLog.update({
      where: { id: existing.id },
      data: {
        type: event.type,
        status: "PROCESSING",
        attempts: { increment: 1 },
        lastError: null,
        failedAt: null,
        processingStartedAt: now,
      },
    });

    return true;
  }

  try {
    await db.stripeEventLog.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        status: "PROCESSING",
        attempts: 1,
        processingStartedAt: now,
      },
    });
  } catch {
    const current = await db.stripeEventLog.findUnique({
      where: { stripeEventId: event.id },
      select: { id: true, status: true },
    });

    if (current?.status === "PROCESSED") {
      return false;
    }

    if (current) {
      await db.stripeEventLog.update({
        where: { id: current.id },
        data: {
          type: event.type,
          status: "PROCESSING",
          attempts: { increment: 1 },
          lastError: null,
          failedAt: null,
          processingStartedAt: now,
        },
      });
    }
  }

  return true;
}

async function markStripeEventProcessed(event: Stripe.Event) {
  await db.stripeEventLog.update({
    where: { stripeEventId: event.id },
    data: {
      type: event.type,
      status: "PROCESSED",
      lastError: null,
      failedAt: null,
      processedAt: new Date(),
    },
  });
}

async function markStripeEventFailed(event: Stripe.Event, error: string) {
  await db.stripeEventLog.update({
    where: { stripeEventId: event.id },
    data: {
      type: event.type,
      status: "FAILED",
      lastError: error.slice(0, 4000),
      failedAt: new Date(),
    },
  });
}

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

function getStripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function getCheckoutSessionIdFromPaymentIntent(paymentIntentId: string) {
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  return sessions.data[0]?.id ?? null;
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = getStripeId(charge.payment_intent);

  if (!paymentIntentId) {
    console.warn("[WEBHOOK_REFUND] No payment_intent on charge:", charge.id);
    return new NextResponse(null, { status: 200 });
  }

  let checkoutSessionId: string | null = null;

  try {
    checkoutSessionId =
      await getCheckoutSessionIdFromPaymentIntent(paymentIntentId);
  } catch (err) {
    console.error("[WEBHOOK_REFUND] Failed to retrieve checkout session:", err);
    return new NextResponse(null, { status: 200 });
  }

  if (!checkoutSessionId) {
    console.warn(
      "[WEBHOOK_REFUND] No checkout session found for charge:",
      charge.id,
    );
    return new NextResponse(null, { status: 200 });
  }

  const appt = await db.appointment.findUnique({
    where: { stripeSessionId: checkoutSessionId },
    select: {
      id: true,
      date: true,
      time: true,
      price: true,
      status: true,
      professionalId: true,
      patient: { select: { name: true, email: true } },
      professional: { select: { name: true, email: true } },
    },
  });

  if (!appt) {
    console.warn(
      "[WEBHOOK_REFUND] No appointment found for session:",
      checkoutSessionId,
    );
    return new NextResponse(null, { status: 200 });
  }

  if (appt.status === "REFUNDED") {
    console.log("[WEBHOOK_REFUND] Appointment already REFUNDED:", appt.id);
    return new NextResponse(null, { status: 200 });
  }

  await db.$transaction(async (tx) => {
    const pendingTransaction = await tx.transaction.findFirst({
      where: {
        appointmentId: appt.id,
        userId: appt.professionalId,
        status: "PENDING",
      },
      select: { id: true, amount: true },
    });

    await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "REFUNDED" },
    });

    if (!pendingTransaction) return;

    await tx.transaction.update({
      where: { id: pendingTransaction.id },
      data: { status: "CANCELED" },
    });

    await tx.user.update({
      where: { id: appt.professionalId },
      data: {
        pendingBalance: {
          decrement: pendingTransaction.amount,
        },
      },
    });
  });

  console.log("[WEBHOOK_REFUND] Appointment marked as REFUNDED:", appt.id);

  await sendRefundProcessedEmail({
    patient: appt.patient,
    professional: appt.professional,
    date: appt.date,
    time: appt.time,
    price: appt.price,
    refundId: charge.refunds?.data[0]?.id,
  });

  return new NextResponse(null, { status: 200 });
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = getStripeId(dispute.payment_intent);

  if (!paymentIntentId) {
    console.warn("[WEBHOOK_DISPUTE] No payment_intent on dispute:", dispute.id);
    return new NextResponse(null, { status: 200 });
  }

  let checkoutSessionId: string | null = null;

  try {
    checkoutSessionId =
      await getCheckoutSessionIdFromPaymentIntent(paymentIntentId);
  } catch (err) {
    console.error(
      "[WEBHOOK_DISPUTE] Failed to retrieve checkout session:",
      err,
    );
    return new NextResponse(null, { status: 200 });
  }

  if (!checkoutSessionId) {
    console.warn(
      "[WEBHOOK_DISPUTE] No checkout session found for dispute:",
      dispute.id,
    );
    return new NextResponse(null, { status: 200 });
  }

  const appt = await db.appointment.findUnique({
    where: { stripeSessionId: checkoutSessionId },
    select: {
      id: true,
      status: true,
      professionalId: true,
    },
  });

  if (!appt) {
    return await handleTechDisputeCreated(
      dispute,
      paymentIntentId,
      checkoutSessionId,
    );
  }

  if (appt.status === "DISPUTED" || appt.status === "REFUNDED") {
    console.log("[WEBHOOK_DISPUTE] Appointment already handled:", appt.id);
    return new NextResponse(null, { status: 200 });
  }

  await db.$transaction(async (tx) => {
    const pendingTransaction = await tx.transaction.findFirst({
      where: {
        appointmentId: appt.id,
        userId: appt.professionalId,
        status: "PENDING",
      },
      select: { id: true, amount: true },
    });

    await tx.appointment.update({
      where: { id: appt.id },
      data: {
        status: "DISPUTED",
        disputeReason: dispute.reason,
        disputeOpenedAt: new Date(),
      },
    });

    if (!pendingTransaction) return;

    await tx.user.update({
      where: { id: appt.professionalId },
      data: {
        pendingBalance: {
          decrement: pendingTransaction.amount,
        },
      },
    });

    await tx.transaction.update({
      where: { id: pendingTransaction.id },
      data: { status: "DISPUTED" },
    });
  });

  console.log("[WEBHOOK_DISPUTE] Appointment marked as DISPUTED:", appt.id);
  return new NextResponse(null, { status: 200 });
}

async function findTechProjectFromStripePayment(
  paymentIntentId: string,
  checkoutSessionId: string | null,
) {
  const project = await db.project.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: paymentIntentId },
        ...(checkoutSessionId ? [{ stripeSessionId: checkoutSessionId }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      professionalId: true,
      agreedPrice: true,
      disputeResolution: true,
    },
  });

  if (project) return project;

  if (!checkoutSessionId) return null;

  const transaction = await db.transaction.findFirst({
    where: {
      projectId: { not: null },
      description: { contains: checkoutSessionId },
    },
    orderBy: { createdAt: "desc" },
    select: { projectId: true },
  });

  if (!transaction?.projectId) return null;

  return db.project.findUnique({
    where: { id: transaction.projectId },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      professionalId: true,
      agreedPrice: true,
      disputeResolution: true,
    },
  });
}

function stripeDisputeSummary(
  dispute: Stripe.Dispute,
  paymentIntentId: string,
  checkoutSessionId: string | null,
  previousStatus?: string,
) {
  const dueBy = dispute.evidence_details?.due_by
    ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
    : "nao informado";

  return [
    `STRIPE_DISPUTE`,
    `Stripe dispute: ${dispute.id}`,
    `PaymentIntent: ${paymentIntentId}`,
    `CheckoutSession: ${checkoutSessionId ?? "nao encontrada"}`,
    `Status Stripe: ${dispute.status}`,
    `Motivo Stripe: ${dispute.reason}`,
    `Valor contestado: ${dispute.amount}`,
    `Prazo evidencia: ${dueBy}`,
    previousStatus ? `Previous status: ${previousStatus}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function previousProjectStatusFromResolution(value: string | null) {
  return value?.match(/Previous status:\s*([A-Z_]+)/)?.[1] ?? null;
}

async function handleTechDisputeCreated(
  dispute: Stripe.Dispute,
  paymentIntentId: string,
  checkoutSessionId: string | null,
) {
  const project = await findTechProjectFromStripePayment(
    paymentIntentId,
    checkoutSessionId,
  );

  if (!project) {
    console.warn("[WEBHOOK_TECH_DISPUTE] No project found:", {
      disputeId: dispute.id,
      paymentIntentId,
      checkoutSessionId,
    });
    return new NextResponse(null, { status: 200 });
  }

  if (project.status === "DISPUTE") {
    await db.project.update({
      where: { id: project.id },
      data: {
        disputeReason: `Stripe: ${dispute.reason}`,
        disputeResolution: stripeDisputeSummary(
          dispute,
          paymentIntentId,
          checkoutSessionId,
          previousProjectStatusFromResolution(project.disputeResolution) ??
            undefined,
        ),
      },
    });

    return new NextResponse(null, { status: 200 });
  }

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: {
        status: "DISPUTE",
        disputeReason: `Stripe: ${dispute.reason}`,
        disputeOpenedAt: new Date(),
        disputeResolution: stripeDisputeSummary(
          dispute,
          paymentIntentId,
          checkoutSessionId,
          project.status,
        ),
      },
    });

    await tx.transaction.updateMany({
      where: {
        projectId: project.id,
        status: { in: ["COMPLETED", "PROCESSING", "PENDING"] },
      },
      data: { status: "DISPUTED" },
    });
  });

  console.log("[WEBHOOK_TECH_DISPUTE] Project marked as DISPUTE:", project.id);
  return new NextResponse(null, { status: 200 });
}

async function handleTechDisputeUpdated(
  dispute: Stripe.Dispute,
  paymentIntentId: string,
  checkoutSessionId: string | null,
) {
  const project = await findTechProjectFromStripePayment(
    paymentIntentId,
    checkoutSessionId,
  );

  if (!project) return new NextResponse(null, { status: 200 });

  await db.project.update({
    where: { id: project.id },
    data: {
      disputeReason: `Stripe: ${dispute.reason}`,
      disputeResolution: stripeDisputeSummary(
        dispute,
        paymentIntentId,
        checkoutSessionId,
        previousProjectStatusFromResolution(project.disputeResolution) ??
          project.status,
      ),
    },
  });

  return new NextResponse(null, { status: 200 });
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const paymentIntentId = getStripeId(dispute.payment_intent);

  if (!paymentIntentId) {
    return new NextResponse(null, { status: 200 });
  }

  let checkoutSessionId: string | null = null;

  try {
    checkoutSessionId =
      await getCheckoutSessionIdFromPaymentIntent(paymentIntentId);
  } catch (err) {
    console.error("[WEBHOOK_DISPUTE_CLOSED] Failed to retrieve session:", err);
    return new NextResponse(null, { status: 200 });
  }

  if (!checkoutSessionId) return new NextResponse(null, { status: 200 });

  const appt = await db.appointment.findUnique({
    where: { stripeSessionId: checkoutSessionId },
    select: {
      id: true,
      professionalId: true,
    },
  });

  if (!appt) {
    return await handleTechDisputeClosed(
      dispute,
      paymentIntentId,
      checkoutSessionId,
    );
  }

  if (dispute.status === "won" || dispute.status === "warning_closed") {
    await db.$transaction(async (tx) => {
      const disputedTransaction = await tx.transaction.findFirst({
        where: {
          appointmentId: appt.id,
          userId: appt.professionalId,
          status: "DISPUTED",
        },
        select: { id: true, amount: true },
      });

      await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "COMPLETED" },
      });

      if (!disputedTransaction) return;

      await tx.user.update({
        where: { id: appt.professionalId },
        data: {
          walletBalance: {
            increment: disputedTransaction.amount,
          },
        },
      });

      await tx.transaction.update({
        where: { id: disputedTransaction.id },
        data: { status: "COMPLETED" },
      });
    });

    console.log(
      "[WEBHOOK_DISPUTE_CLOSED] Dispute won - balance restored for appointment:",
      appt.id,
    );
  } else if (dispute.status === "lost") {
    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "REFUNDED" },
      });

      await tx.transaction.updateMany({
        where: {
          appointmentId: appt.id,
          userId: appt.professionalId,
          status: "DISPUTED",
        },
        data: { status: "CANCELED" },
      });
    });

    console.log(
      "[WEBHOOK_DISPUTE_CLOSED] Dispute lost - appointment marked REFUNDED:",
      appt.id,
    );
  }

  return new NextResponse(null, { status: 200 });
}

async function handleTechDisputeClosed(
  dispute: Stripe.Dispute,
  paymentIntentId: string,
  checkoutSessionId: string | null,
) {
  const project = await findTechProjectFromStripePayment(
    paymentIntentId,
    checkoutSessionId,
  );

  if (!project) return new NextResponse(null, { status: 200 });

  const previousStatus =
    previousProjectStatusFromResolution(project.disputeResolution) ??
    "IN_PROGRESS";
  const resolution = stripeDisputeSummary(
    dispute,
    paymentIntentId,
    checkoutSessionId,
    previousStatus,
  );

  if (dispute.status === "won" || dispute.status === "warning_closed") {
    await db.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: project.id },
        data: {
          status:
            previousStatus === "COMPLETED" ||
            previousStatus === "UNDER_REVIEW" ||
            previousStatus === "IN_PROGRESS"
              ? previousStatus
              : "IN_PROGRESS",
          disputeResolvedAt: new Date(),
          disputeResolution: `${resolution} | Resultado: WON`,
        },
      });

      await tx.transaction.updateMany({
        where: {
          projectId: project.id,
          status: "DISPUTED",
        },
        data: { status: "COMPLETED" },
      });
    });

    console.log("[WEBHOOK_TECH_DISPUTE_CLOSED] Dispute won:", project.id);
    return new NextResponse(null, { status: 200 });
  }

  if (dispute.status === "lost") {
    await db.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: project.id },
        data: {
          status: "CANCELED",
          disputeResolvedAt: new Date(),
          disputeResolution: `${resolution} | Resultado: LOST`,
        },
      });

      await tx.transaction.updateMany({
        where: {
          projectId: project.id,
          status: "DISPUTED",
        },
        data: { status: "CANCELED" },
      });
    });

    console.log("[WEBHOOK_TECH_DISPUTE_CLOSED] Dispute lost:", project.id);
  }

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

  const shouldProcess = await claimStripeEvent(event);

  if (!shouldProcess) {
    console.log(`[WEBHOOK] Skipping processed event: ${event.id}`);
    return new NextResponse(null, { status: 200 });
  }

  const handleProjectPayment = async (
    proposalId: string,
    buyerId: string,
    session: Stripe.Checkout.Session,
  ) => {
    const result = await finalizeProjectPayment({
      proposalId,
      buyerId,
      source: "webhook",
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
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

  const processEvent = async () => {
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
            session,
          );
          return new NextResponse(null, { status: 200 });
        }

        if (session.mode === "subscription") {
          if (!session?.metadata?.userId) {
            return new NextResponse(null, { status: 200 });
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

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return await handleChargeRefunded(charge);
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        return await handleDisputeCreated(dispute);
      }

      case "charge.dispute.updated":
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.funds_reinstated": {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = getStripeId(dispute.payment_intent);

        if (!paymentIntentId) {
          return new NextResponse(null, { status: 200 });
        }

        const checkoutSessionId =
          await getCheckoutSessionIdFromPaymentIntent(paymentIntentId);
        const appt = checkoutSessionId
          ? await db.appointment.findUnique({
              where: { stripeSessionId: checkoutSessionId },
              select: { id: true },
            })
          : null;

        if (appt) return new NextResponse(null, { status: 200 });

        return await handleTechDisputeUpdated(
          dispute,
          paymentIntentId,
          checkoutSessionId,
        );
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        return await handleDisputeClosed(dispute);
      }

      default:
        return new NextResponse(null, { status: 200 });
    }
  };

  try {
    const response = await processEvent();

    if (responseIsSuccess(response)) {
      await markStripeEventProcessed(event);
    } else {
      await markStripeEventFailed(event, `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    await markStripeEventFailed(event, errorToMessage(error));
    return new NextResponse("Database Error", { status: 500 });
  }
}
