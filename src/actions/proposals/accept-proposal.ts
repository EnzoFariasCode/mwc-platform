"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function acceptProposalAndStartProject(proposalId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Busca a proposta para ter certeza que existe e pegar dados
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true },
    });

    if (!proposal) return { success: false, error: "Proposta não encontrada" };

    // 2. Segurança: Só o dono do projeto pode aceitar
    if (proposal.project.ownerId !== userId) {
      return { success: false, error: "Você não é o dono deste projeto." };
    }

    // 3. Transação Atômica (Ou faz tudo, ou não faz nada)
    await db.$transaction([
      // A. Marca a proposta escolhida como ACCEPTED
      db.proposal.update({
        where: { id: proposalId },
        data: { status: "ACCEPTED" },
      }),

      db.proposal.updateMany({
        where: { projectId: proposal.projectId, id: { not: proposalId } },
        data: { status: "REJECTED" },
      }),

      // C. Atualiza o PROJETO: Status, Preço Acordado e Vincula o Profissional
      db.project.update({
        where: { id: proposal.projectId },
        data: {
          status: "IN_PROGRESS", // O projeto começa!
          professionalId: proposal.professionalId, // Vincula o Worker
          agreedPrice: proposal.price, // Salva o valor fechado
          deadline: new Date(
            Date.now() + proposal.estimatedDays * 24 * 60 * 60 * 1000
          ).toLocaleDateString("pt-BR"), // (Opcional) Recalcula data final baseado nos dias da proposta
        },
      }),
    ]);

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao aceitar proposta:", error);
    return { success: false, error: "Erro interno ao processar contratação." };
  }
}
