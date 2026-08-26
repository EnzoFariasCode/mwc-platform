"use server";

import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import {
  BillingPortalError,
  createTechBillingPortalSession,
} from "@/modules/stripe/services/tech-billing-portal";

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
    select: {
      id: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "Usuário não encontrado.",
    };
  }

  try {
    const portalSession = await createTechBillingPortalSession(user);

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof BillingPortalError
          ? error.userMessage
          : "Não foi possível abrir o portal da Stripe.",
    };
  }
}
