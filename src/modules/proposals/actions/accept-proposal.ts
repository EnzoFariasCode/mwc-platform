"use server";

import { ActionResponse } from "@/modules/users/types/user-types";

export async function acceptProposalAndStartProject(): Promise<ActionResponse> {
  return {
    success: false,
    error:
      "Fluxo direto desativado. Use o pagamento via Stripe para iniciar projetos.",
  };
}
