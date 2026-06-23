"use server";

import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function createPortalSession(): Promise<
  ActionResponse<{ url: string }>
> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Não autorizado" };
  }

  if (
    session.userType !== "PROFESSIONAL" ||
    session.industry !== "TECH"
  ) {
    return {
      success: false,
      error: "Ação restrita a profissionais de Tecnologia.",
    };
  }

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
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profissional`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    console.error("Erro ao criar portal:", error);
    return { success: false, error: "Erro ao abrir painel financeiro." };
  }
}
