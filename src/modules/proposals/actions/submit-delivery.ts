"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

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

    await db.$transaction([
      db.deliverable.create({
        data: {
          projectId,
          link,
          description,
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
