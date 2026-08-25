import "server-only";

import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/prisma";

const PROCESSING_LEASE_MINUTES = 10;

export type StripeEventClaim = "CLAIMED" | "PROCESSED" | "BUSY";

export async function claimStripeEvent(
  event: Pick<Stripe.Event, "id" | "type">,
): Promise<StripeEventClaim> {
  const existing = await db.stripeEventLog.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true, status: true },
  });

  if (existing?.status === "PROCESSED") return "PROCESSED";

  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - PROCESSING_LEASE_MINUTES * 60 * 1000,
  );

  if (existing) {
    const claimed = await db.stripeEventLog.updateMany({
      where: {
        id: existing.id,
        status: { not: "PROCESSED" },
        OR: [
          { status: { not: "PROCESSING" } },
          { processingStartedAt: null },
          { processingStartedAt: { lte: staleBefore } },
        ],
      },
      data: {
        type: event.type,
        status: "PROCESSING",
        attempts: { increment: 1 },
        lastError: null,
        failedAt: null,
        processingStartedAt: now,
      },
    });

    if (claimed.count === 1) return "CLAIMED";

    const current = await db.stripeEventLog.findUnique({
      where: { stripeEventId: event.id },
      select: { status: true },
    });
    return current?.status === "PROCESSED" ? "PROCESSED" : "BUSY";
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
    return "CLAIMED";
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return claimStripeEvent(event);
    }
    throw error;
  }
}

export async function markStripeEventProcessed(
  event: Pick<Stripe.Event, "id" | "type">,
) {
  await db.stripeEventLog.update({
    where: { stripeEventId: event.id },
    data: {
      type: event.type,
      status: "PROCESSED",
      lastError: null,
      failedAt: null,
      processedAt: new Date(),
      processingStartedAt: null,
    },
  });
}

export async function markStripeEventFailed(
  event: Pick<Stripe.Event, "id" | "type">,
  error: string,
  client: Pick<Prisma.TransactionClient, "stripeEventLog"> = db,
) {
  await client.stripeEventLog.update({
    where: { stripeEventId: event.id },
    data: {
      type: event.type,
      status: "FAILED",
      lastError: error.slice(0, 4000),
      failedAt: new Date(),
      processingStartedAt: null,
    },
  });
}
