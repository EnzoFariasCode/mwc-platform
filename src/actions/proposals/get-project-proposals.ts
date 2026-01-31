"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getProjectProposals(projectId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Verifica se o projeto é MEU (Segurança)
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== userId) {
      return {
        success: false,
        error: "Você não tem permissão para ver estas propostas.",
      };
    }

    // 2. Busca as propostas
    const proposals = await db.proposal.findMany({
      where: { projectId },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            rating: true,
            userType: true,
            // avatarUrl: true, // Se tiver campo de foto, adicione aqui (ou delete se não tiver)
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: proposals };
  } catch (error) {
    console.error("Erro ao buscar propostas:", error);
    return { success: false, error: "Erro interno." };
  }
}
