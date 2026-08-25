"use server";

import { randomUUID } from "crypto";
import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { enqueueAdminNotificationEmails } from "@/modules/email/services/admin-finance-email-service";
import {
  getTechPlanId,
  isActiveTechSubscription,
  isPaidTechPlanTier,
  TECH_PLAN_LIMITS,
} from "@/modules/subscriptions/tech-plan";
import type { ActionResponse } from "@/modules/users/types/user-types";

const SUPPORT_LIMIT = 3;
const SUPPORT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1200;

function normalizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

export async function requestTechSupport({
  subject,
  message,
}: {
  subject: string;
  message: string;
}): Promise<ActionResponse> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado." };
  }

  if (session.userType !== "PROFESSIONAL" || session.industry !== "TECH") {
    return {
      success: false,
      error: "Suporte tecnico prioritario restrito a profissionais Tech.",
    };
  }

  const safeSubject = normalizeText(subject, MAX_SUBJECT_LENGTH);
  const safeMessage = normalizeText(message, MAX_MESSAGE_LENGTH);

  if (safeSubject.length < 5 || safeMessage.length < 20) {
    return {
      success: false,
      error: "Informe um assunto e descreva o problema com mais detalhes.",
    };
  }

  const rateLimitError = await consumeRateLimit({
    key: `support:tech:${session.id}`,
    limit: SUPPORT_LIMIT,
    windowMs: SUPPORT_WINDOW_MS,
    message: "Muitas solicitacoes de suporte. Aguarde antes de enviar outra.",
  });

  if (rateLimitError) {
    return { success: false, error: rateLimitError };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      stripeSubscriptionStatus: true,
      stripePriceId: true,
      professionalPlanTier: true,
    },
  });

  if (!user) {
    return { success: false, error: "Usuario nao encontrado." };
  }

  const hasPaidPlan =
    isActiveTechSubscription(user.stripeSubscriptionStatus) &&
    isPaidTechPlanTier(user.professionalPlanTier);

  if (!hasPaidPlan) {
    return {
      success: false,
      error:
        "O suporte tecnico prioritario esta disponivel para assinantes Starter e Advanced.",
    };
  }

  const supportId = randomUUID();
  const planId = getTechPlanId(user);
  const planLabel = TECH_PLAN_LIMITS[planId].label;
  await db.$transaction(async (tx) => {
    await enqueueAdminNotificationEmails(tx, {
      roles: ["OWNER", "SUPPORT"],
      eventType: "ADMIN_TECH_SUPPORT_REQUESTED",
      entityType: "TECH_SUPPORT_REQUEST",
      entityId: supportId,
      title: `Suporte tecnico Tech - ${safeSubject}`,
      summary: `${user.name || user.email || "Profissional"} solicitou suporte prioritario.`,
      lines: [safeMessage],
      details: [
        { label: "Profissional", value: user.name || "Sem nome" },
        { label: "Email", value: user.email || "Sem email" },
        { label: "Plano", value: planLabel },
        { label: "ID do pedido", value: supportId },
      ],
      actionPath: "/dashboard/admin/usuarios",
      actionLabel: "Abrir usuarios",
      actorId: user.id,
      notification: {
        type: "INFO",
        title: "Novo pedido de suporte Tech",
        message: safeSubject,
        metadata: {
          supportId,
          plan: planLabel,
          subject: safeSubject,
          message: safeMessage,
          professionalId: user.id,
          professionalEmail: user.email,
        },
      },
    });
  });

  return { success: true };
}
