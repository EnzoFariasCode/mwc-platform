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

  // 1. Verificar se a requisição veio mesmo da Stripe
  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or secret");
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 2. Processar os Eventos
  try {
    switch (event.type) {
      // =========================================================
      // CHECKOUT COMPLETADO (Pode ser Assinatura OU Projeto)
      // =========================================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // --- CENÁRIO A: PAGAMENTO DE PROJETO (ESCROW) ---
        if (session.metadata?.type === "project_payment") {
          const proposalId = session.metadata.proposalId;

          if (!proposalId) {
            console.error(
              "Webhook: ProposalId não encontrado nos metadados do projeto.",
            );
            break;
          }

          const proposal = await db.proposal.findUnique({
            where: { id: proposalId },
            include: { project: true },
          });

          if (proposal) {
            // Transação Atômica: Atualiza Proposta, Projeto e Gera o Saldo Retido
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
                    Date.now() + proposal.estimatedDays * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString("pt-BR"),
                },
              }),

              // Registra a retenção do dinheiro
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
              `✅ Projeto ${proposal.projectId} iniciado com sucesso via Stripe!`,
            );
          }
          break; // Sai do switch para não executar o código de assinatura abaixo
        }

        // --- CENÁRIO B: PRIMEIRA ASSINATURA DE PLANO ---
        if (session.mode === "subscription") {
          if (!session?.metadata?.userId) {
            console.error(
              "Webhook: UserId não encontrado nos metadados da assinatura.",
            );
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
          console.log(`✅ Usuário ${session.metadata.userId} agora é PRO!`);
        }
        break;
      }

      // =========================================================
      // RENOVAÇÃO AUTOMÁTICA (Assinaturas)
      // =========================================================
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
        console.log(`✅ Assinatura ${subId} renovada com sucesso.`);
        break;
      }

      // =========================================================
      // FALHA NO PAGAMENTO (Assinaturas)
      // =========================================================
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
        console.log(`⚠️ Falha no pagamento da assinatura ${subId}`);
        break;
      }

      // =========================================================
      // CANCELAMENTO (Assinaturas)
      // =========================================================
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
          `🔄 Status da assinatura ${subscription.id} atualizado para: ${subDetails.status}`,
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
