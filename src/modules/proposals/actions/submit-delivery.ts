"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitDelivery(
  projectId: string,
  link: string,
  description: string
) {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado" };

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { professionalId: true, status: true },
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

    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao entregar projeto:", error);
    return { success: false, error: "Erro ao enviar entrega." };
  }
}
