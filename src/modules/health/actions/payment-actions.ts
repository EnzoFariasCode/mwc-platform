"use server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";
import { auth } from "@/auth"; // Seu método de pegar sessão
import { headers } from "next/headers";

export async function createCheckoutSession(
  proId: string,
  date: string,
  time: string,
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Não autorizado");

    // 1. Busca o profissional para garantir o PREÇO REAL do banco (Anti-fraude)
    const professional = await db.user.findUnique({
      where: { id: proId },
      select: { name: true, consultationFee: true },
    });

    if (!professional || !professional.consultationFee) {
      throw new Error("Profissional não encontrado ou sem valor de consulta.");
    }

    // 2. Converte Decimal para centavos (Stripe usa inteiros: R$ 150,00 -> 15000)
    const unitAmount = Math.round(Number(professional.consultationFee) * 100);

    const origin = headers().get("origin");

    // 3. Cria a sessão do Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email!,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Consulta com ${professional.name}`,
              description: `Agendamento para o dia ${date} às ${time}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      // Passamos os dados da consulta no metadata para processar após o pagamento
      metadata: {
        proId,
        patientId: session.user.id,
        date,
        time,
        type: "HEALTH_APPOINTMENT",
      },
      success_url: `${origin}/checkout-saude/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/agendar-consulta/perfil/${proId}`,
    });

    return { url: stripeSession.url };
  } catch (error: any) {
    console.error("Erro Stripe:", error);
    return { error: error.message || "Erro ao gerar pagamento" };
  }
}
