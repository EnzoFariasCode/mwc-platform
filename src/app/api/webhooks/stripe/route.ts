import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any, // Mantenha a versão do seu package.json
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

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  // 2. Processar os Eventos
  try {
    switch (event.type) {
      // CENÁRIO A: Primeira Assinatura (Checkout completado)
      case "checkout.session.completed": {
        if (!session?.metadata?.userId) {
          console.error("Webhook: UserId não encontrado nos metadados.");
          break;
        }

        // Recuperar detalhes completos da assinatura
        // [CORREÇÃO AQUI]: Adicionado "as Stripe.Subscription"
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
            stripeSubscriptionStatus: subscriptionDetails.status, // "active"
          },
        });
        console.log(`✅ Usuário ${session.metadata.userId} agora é PRO!`);
        break;
      }

      // CENÁRIO B: Renovação Automática (Todo mês)
      case "invoice.payment_succeeded": {
        // Aqui não temos metadata fácil, então buscamos pelo ID da assinatura
        const subId = subscription.id || session.subscription;

        // Pega dados atualizados da assinatura
        // [CORREÇÃO AQUI]: Adicionado "as Stripe.Subscription"
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
            stripeSubscriptionStatus: subDetails.status, // "active"
          },
        });
        console.log(`✅ Assinatura ${subId} renovada com sucesso.`);
        break;
      }

      // CENÁRIO C: Falha no Pagamento (Cartão recusado/sem limite)
      case "invoice.payment_failed": {
        const subId = subscription.id || session.subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subId as string },
          data: {
            stripeSubscriptionStatus: "past_due", // Ou "unpaid"
          },
        });
        console.log(`⚠️ Falha no pagamento da assinatura ${subId}`);
        break;
      }

      // CENÁRIO D: Atualização ou Cancelamento
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subId = subscription.id;

        // [CORREÇÃO AQUI]: Adicionado "as Stripe.Subscription"
        const subDetails = (await stripe.subscriptions.retrieve(
          subId as string,
        )) as Stripe.Subscription;

        await db.user.update({
          where: { stripeSubscriptionId: subId },
          data: {
            stripeSubscriptionStatus: subDetails.status, // "canceled", "active", etc
            stripeCurrentPeriodEnd: new Date(
              ((subDetails as any).current_period_end ?? 0) * 1000,
            ),
          },
        });
        console.log(
          `🔄 Status da assinatura ${subId} atualizado para: ${subDetails.status}`,
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
