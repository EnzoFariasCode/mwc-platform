"use server";

import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function injectFakeMoney(): Promise<ActionResponse> {
  const devToolsEnabled = process.env.ENABLE_DEV_TOOLS === "true";
  if (!devToolsEnabled || process.env.NODE_ENV === "production") {
    return { success: false, error: "Operacao indisponivel." };
  }

  const session = await getUserSession();

  if (!session) {
    // Em actions de form, idealmente não retornamos objeto se não usarmos useFormState,
    // mas para esse teste rápido, apenas console.error ou throw funciona.
    console.error("Sem usuário");
    return { success: false, error: "Nao autorizado." };
  }

  if (session.role !== "ADMIN") {
    return { success: false, error: "Nao autorizado." };
  }

  await db.$transaction([
    db.user.update({
      where: { id: session.id },
      data: { walletBalance: { increment: 150 } },
    }),
    db.transaction.create({
      data: {
        userId: session.id,
        amount: 150,
        type: "CREDIT",
        status: "COMPLETED",
        description: "Projeto Teste (Dinheiro Falso)",
      },
    }),
  ]);

  revalidatePath("/dashboard/financeiro");
  // Retornamos sucesso apenas para padronizar o ActionResponse.
  return { success: true };
}

