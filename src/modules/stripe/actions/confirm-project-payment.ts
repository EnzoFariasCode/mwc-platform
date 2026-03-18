"use server";

import Stripe from "stripe";
import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function confirmProjectPayment(sessionId: string) {
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

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { project: true },
  });

  if (!proposal) {
    return { success: false, error: "Proposta nao encontrada." };
  }

  if (proposal.project.ownerId !== buyerId) {
    return { success: false, error: "Usuario nao e dono do projeto." };
  }

  if (
    ["IN_PROGRESS", "UNDER_REVIEW", "COMPLETED"].includes(
      proposal.project.status
    ) &&
    proposal.status === "ACCEPTED"
  ) {
    return { success: true };
  }

  const proposalStatusOk = ["PENDING", "ACCEPTED"].includes(proposal.status);
  const projectStatusOk = ["OPEN", "WAITING_PAYMENT"].includes(
    proposal.project.status
  );

  if (!proposalStatusOk || !projectStatusOk) {
    return { success: false, error: "Estado invalido para confirmacao." };
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

  return { success: true };
}
