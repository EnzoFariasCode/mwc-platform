"use server";

import Stripe from "stripe";
import { getUserSession } from "@/lib/get-session";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover" as any,
});

export async function createPortalSession(): Promise<
  ActionResponse<{ url: string }>
> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Não autorizado" };
  }

  // 1. Buscar o Customer ID no banco
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { stripeCustomerId: true },
  });

  if (!user || !user.stripeCustomerId) {
    return {
      success: false,
      error: "Nenhuma assinatura encontrada para gerenciar.",
    };
  }

  try {
    // 2. Gerar o link do Portal na Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profissional`, // Para onde ele volta
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    console.error("Erro ao criar portal:", error);
    return { success: false, error: "Erro ao abrir painel financeiro." };
  }
}
