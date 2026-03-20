"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth"; // Certifique-se que o verifySession está sendo exportado do seu lib/auth
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

// 👇 ESSA PARTE É OBRIGATÓRIA PARA O ERRO SUMIR
interface CreateProposalData {
  projectId: string;
  price: number;
  days: number;
  coverLetter: string;
}

export async function createProposal(
  data: CreateProposalData
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Você precisa estar logado." };
    }

    // 1. Verifica se o usuário é Profissional
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (user?.userType !== "PROFESSIONAL") {
      return {
        success: false,
        error: "Apenas profissionais podem enviar propostas.",
      };
    }

    // 2. Verifica se o projeto existe e está ABERTO
    const project = await db.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return { success: false, error: "Projeto não encontrado." };
    }

    if (project.status !== "OPEN") {
      return {
        success: false,
        error: "Este projeto não está mais aceitando propostas.",
      };
    }

    // 3. Verifica se já enviou proposta antes (Evitar duplicidade)
    const existingProposal = await db.proposal.findFirst({
      where: {
        projectId: data.projectId,
        professionalId: userId,
      },
    });

    if (existingProposal) {
      return {
        success: false,
        error: "Você já enviou uma proposta para este projeto.",
      };
    }

    // 4. Cria a Proposta
    await db.proposal.create({
      data: {
        projectId: data.projectId,
        professionalId: userId,
        price: data.price,
        estimatedDays: data.days,
        coverLetter: data.coverLetter,
        status: "PENDING",
      },
    });

    // 5. Incrementa o contador
    await db.project.update({
      where: { id: data.projectId },
      data: { bidsCount: { increment: 1 } },
    });

    revalidatePath(`/dashboard/encontrar-projetos/${data.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar proposta:", error);
    return { success: false, error: "Erro interno ao enviar proposta." };
  }
}
