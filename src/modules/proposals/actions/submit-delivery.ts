"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

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
      select: { id: true, title: true, ownerId: true, professionalId: true, status: true },
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

    await db.$transaction([
      db.deliverable.create({
        data: {
          projectId,
          link: deliveryLink,
          description: deliveryDescription,
          senderId: userId,
        },
      }),
      db.project.update({
        where: { id: projectId },
        data: { status: "UNDER_REVIEW" },
      }),
    ]);

    await upsertNotification({
      userId: project.ownerId,
      actorId: userId,
      type: "WARNING",
      eventType: "TECH_DELIVERY_SUBMITTED",
      title: "Entrega aguardando aprovacao",
      message: `O projeto "${project.title}" foi entregue. Revise para aprovar ou pedir ajustes.`,
      link: "/dashboard/meus-projetos",
      entityType: "TECH_PROJECT",
      entityId: project.id,
      metadata: { projectId: project.id },
    });

    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao entregar projeto:", error);
    return { success: false, error: "Erro ao enviar entrega." };
  }
}
