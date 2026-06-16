"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProjectCheckoutHoldStatus, ProposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function cancelProjectPayment(
  proposalId: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado." };
    if (session?.userType !== "CLIENT") {
      return { success: false, error: "Ação restrita a clientes." };
    }
    if (!proposalId) return { success: false, error: "Proposta invalida." };

    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true },
    });

    if (!proposal || proposal.project.ownerId !== userId) {
      return { success: false, error: "Proposta nao encontrada." };
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      return {
        success: false,
        error: "Esta proposta nao pode ser cancelada.",
      };
    }

    const updated = await db.projectCheckoutHold.updateMany({
      where: {
        proposalId: proposal.id,
        projectId: proposal.projectId,
        buyerId: userId,
        status: ProjectCheckoutHoldStatus.PENDING,
      },
      data: {
        status: ProjectCheckoutHoldStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: "Nenhum checkout pendente encontrado.",
      };
    }

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/anuncios");

    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar pagamento:", error);
    return { success: false, error: "Erro ao cancelar pagamento." };
  }
}
