"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { getTechProjectReviewDeadline } from "@/modules/projects/lib/tech-project-review-deadline";
import { enqueueTechEmail } from "@/modules/email/services/tech-email-service";

const DELIVERY_DESCRIPTION_MIN = 20;
const DELIVERY_DESCRIPTION_MAX = 3000;
const DELIVERY_LINK_MAX = 500;

function normalizeDeliveryText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function submitDelivery(
  projectId: string,
  link: string,
  description: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado" };

    if (
      session?.userType !== "PROFESSIONAL" ||
      session?.industry !== "TECH"
    ) {
      return {
        success: false,
        error: "Ação restrita a profissionais de Tecnologia.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        professionalId: true,
        status: true,
        owner: {
          select: { id: true, email: true, name: true, displayName: true },
        },
        professional: {
          select: { name: true, displayName: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.professionalId !== userId) {
      return {
        success: false,
        error: "Voce nao tem permissao para entregar este projeto.",
      };
    }

    if (project.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "Status invalido para entrega.",
      };
    }

    const deliveryLink = normalizeDeliveryText(link);
    const deliveryDescription = normalizeDeliveryText(description);

    if (
      !deliveryLink ||
      deliveryLink.length > DELIVERY_LINK_MAX ||
      !isHttpUrl(deliveryLink)
    ) {
      return { success: false, error: "Informe um link de entrega valido." };
    }

    if (
      deliveryDescription.length < DELIVERY_DESCRIPTION_MIN ||
      deliveryDescription.length > DELIVERY_DESCRIPTION_MAX
    ) {
      return {
        success: false,
        error: "Informe uma descricao de entrega valida.",
      };
    }

    const deliveredAt = new Date();
    const reviewDeadlineAt = getTechProjectReviewDeadline(deliveredAt);

    await db.$transaction(async (tx) => {
      const movedToReview = await tx.project.updateMany({
        where: {
          id: projectId,
          professionalId: userId,
          status: "IN_PROGRESS",
          cancellationProcessingAt: null,
        },
        data: {
          status: "UNDER_REVIEW",
          deliveredAt,
          reviewDeadlineAt,
          reviewReminder3dSentAt: null,
          reviewReminder1dSentAt: null,
          autoReleasedAt: null,
        },
      });

      if (movedToReview.count !== 1) {
        throw new Error("PROJECT_STATUS_CHANGED");
      }

      await tx.deliverable.create({
        data: {
          projectId,
          link: deliveryLink,
          description: deliveryDescription,
          senderId: userId,
        },
      });

      await upsertNotification({
        userId: project.ownerId,
        actorId: userId,
        type: "WARNING",
        eventType: "TECH_DELIVERY_SUBMITTED",
        title: "Entrega aguardando aprovacao",
        message: `O projeto "${project.title}" foi entregue. Voce tem 7 dias para aprovar, pedir revisao ou abrir disputa. Sem acao, o pagamento sera liberado.`,
        link: "/dashboard/meus-projetos",
        entityType: "TECH_PROJECT",
        entityId: project.id,
        metadata: {
          projectId: project.id,
          reviewDeadlineAt: reviewDeadlineAt.toISOString(),
        },
      }, tx);

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_DELIVERY_SUBMITTED:${project.id}:${project.ownerId}:${deliveredAt.toISOString()}`,
        eventType: "TECH_DELIVERY_SUBMITTED",
        templateKey: "tech.delivery.submitted",
        recipient: project.owner,
        entityType: "TECH_PROJECT",
        entityId: project.id,
        content: {
          title: "Projeto entregue para analise",
          preview: `${project.title} foi entregue pelo profissional.`,
          lines: [
            "O profissional enviou a entrega do projeto para sua analise.",
            "Voce tem ate 7 dias para aprovar, pedir ajustes ou abrir uma disputa. Sem acao, o pagamento sera liberado automaticamente.",
          ],
          details: [
            { label: "Projeto", value: project.title },
            {
              label: "Profissional",
              value:
                project.professional?.displayName ||
                project.professional?.name ||
                "Profissional",
            },
            {
              label: "Prazo para analise",
              value: reviewDeadlineAt.toLocaleDateString("pt-BR"),
            },
          ],
          actionLabel: "Analisar entrega",
          actionPath: "/dashboard/meus-projetos",
        },
      });
    });

    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao entregar projeto:", error);
    if (error instanceof Error && error.message === "PROJECT_STATUS_CHANGED") {
      return {
        success: false,
        error: "O projeto mudou de status e nao pode mais ser entregue.",
      };
    }
    return { success: false, error: "Erro ao enviar entrega." };
  }
}
