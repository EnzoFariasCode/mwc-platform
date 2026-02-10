"use server";

import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";

// ADICIONADO: _formData para satisfazer a tipagem do <form action>
export async function injectFakeMoney(_formData: FormData) {
  const session = await getUserSession();

  if (!session) {
    // Em actions de form, idealmente não retornamos objeto se não usarmos useFormState,
    // mas para esse teste rápido, apenas console.error ou throw funciona.
    console.error("Sem usuário");
    return;
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
  // Não precisamos retornar nada aqui para o form funcionar
}
