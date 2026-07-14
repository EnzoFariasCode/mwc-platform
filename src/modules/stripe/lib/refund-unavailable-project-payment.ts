import "server-only";

import { ProjectCheckoutHoldStatus } from "@prisma/client";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

type RefundUnavailableProjectPaymentInput = {
  proposalId: string;
  buyerId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  reason: string;
};

export async function refundUnavailableProjectPayment({
  proposalId,
  buyerId,
  stripeSessionId,
  stripePaymentIntentId,
  reason,
}: RefundUnavailableProjectPaymentInput) {
  const refund = await stripe.refunds.create(
    { payment_intent: stripePaymentIntentId },
    { idempotencyKey: `tech-unavailable-proposal-${stripeSessionId}` },
  );

  await db.projectCheckoutHold.updateMany({
    where: {
      proposalId,
      stripeSessionId,
      status: { not: ProjectCheckoutHoldStatus.COMPLETED },
    },
    data: {
      status: ProjectCheckoutHoldStatus.CANCELED,
      stripePaymentIntentId,
      canceledAt: new Date(),
      failureReason: `${reason} Estorno Stripe: ${refund.id}`,
    },
  });

  await upsertNotification({
    userId: buyerId,
    type: "WARNING",
    eventType: "TECH_UNAVAILABLE_PROPOSAL_REFUNDED",
    title: "Pagamento estornado",
    message:
      "A proposta foi cancelada antes da confirmacao. O pagamento foi estornado pela Stripe.",
    link: "/dashboard/meus-projetos",
    entityType: "TECH_PROPOSAL",
    entityId: proposalId,
    metadata: {
      proposalId,
      stripeSessionId,
      stripePaymentIntentId,
      stripeRefundId: refund.id,
    },
  });

  return refund;
}
