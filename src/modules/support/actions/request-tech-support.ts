"use server";

import { randomUUID } from "crypto";
import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { sendAdminNotification } from "@/modules/admin/services/admin-notification-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
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
  const admins = await db.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      upsertNotification({
        userId: admin.id,
        actorId: user.id,
        type: "INFO",
        eventType: "TECH_SUPPORT_REQUESTED",
        title: "Novo suporte tecnico Tech",
        message: `${user.name || user.email || "Profissional"} solicitou suporte: ${safeSubject}`,
        link: "/dashboard/admin/usuarios",
        entityType: "TECH_SUPPORT",
        entityId: supportId,
        metadata: {
          supportId,
          plan: planLabel,
          subject: safeSubject,
          message: safeMessage,
          professionalId: user.id,
          professionalEmail: user.email,
        },
      }),
    ),
  );

  await sendAdminNotification({
    subject: `Suporte tecnico Tech - ${safeSubject}`,
    lines: [
      `Profissional: ${user.name || "Sem nome"}`,
      `Email: ${user.email || "Sem email"}`,
      `Plano: ${planLabel}`,
      `ID do pedido: ${supportId}`,
      "",
      "Mensagem:",
      safeMessage,
    ],
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/admin/usuarios`,
  });

  return { success: true };
}
