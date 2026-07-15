"use server";

import { verifySession } from "@/lib/auth";
import { releaseTechProjectPayment } from "@/modules/projects/services/tech-project-release-service";
import { ActionResponse } from "@/modules/users/types/user-types";
import { revalidatePath } from "next/cache";

export async function approveProject(
  projectId: string,
  rating: number,
  comment?: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado" };
    if (session.userType === "ADMIN") {
      return {
        success: false,
        error: "Contas administrativas nao podem aprovar projetos como cliente.",
      };
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "Nota invalida (1 a 5)." };
    }

    const result = await releaseTechProjectPayment({
      projectId,
      source: "CLIENT_APPROVAL",
      clientId: userId,
      rating,
      comment,
    });

    if (!result.released) {
      return {
        success: false,
        error: "A entrega ja foi processada ou nao esta mais em analise.",
      };
    }

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/financeiro");
    revalidatePath(`/dashboard/profissional/${result.project.professionalId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar projeto e liberar pagamento:", error);

    if (error instanceof Error) {
      const messages: Record<string, string> = {
        PROJECT_NOT_FOUND: "Projeto nao encontrado.",
        PROJECT_OWNER_REQUIRED: "Apenas o dono pode aprovar a entrega.",
        PROJECT_PAYMENT_DATA_MISSING:
          "Profissional ou valor nao definidos neste projeto.",
        INVALID_REVIEW: "Nota invalida (1 a 5).",
        REVIEW_ALREADY_SENT: "Avaliacao ja enviada para este projeto.",
        PROFESSIONAL_NOT_FOUND: "Profissional nao encontrado.",
      };
      if (messages[error.message]) {
        return { success: false, error: messages[error.message] };
      }
    }

    return {
      success: false,
      error: "Erro interno ao finalizar projeto e transferir valores.",
    };
  }
}
