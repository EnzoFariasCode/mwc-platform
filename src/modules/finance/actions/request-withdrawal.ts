"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function requestWithdrawal(
  formData: FormData
): Promise<ActionResponse<string>> {
  const session = await getUserSession();
  if (!session) return { success: false, error: "Não autorizado." };

  const cpfPix = formData.get("cpfPix") as string;

  if (!cpfPix || cpfPix.length < 11) {
    return { success: false, error: "CPF inválido. Digite apenas números." };
  }

  // Usamos transaction do Prisma para garantir que não haja erro no meio do caminho
  // (Ex: Criar o saque mas não descontar do saldo)
  try {
    await db.$transaction(async (tx) => {
      // 1. Buscar saldo atualizado (para evitar race condition)
      const user = await tx.user.findUnique({
        where: { id: session.id },
        select: { walletBalance: true },
      });

      if (!user || user.walletBalance < 50) {
        throw new Error("Saldo insuficiente (Mínimo R$ 50,00).");
      }

      const amountToWithdraw = user.walletBalance;

      // 2. Criar o registro da Transação (Saque)
      await tx.transaction.create({
        data: {
          userId: session.id,
          amount: amountToWithdraw,
          type: "DEBIT",
          status: "PENDING", // Fica pendente até você pagar manualmente no banco
          description: `Solicitação de Saque (CPF: ${cpfPix})`,
        },
      });

      // 3. Zerar o saldo do usuário e salvar a chave Pix usada
      await tx.user.update({
        where: { id: session.id },
        data: {
          walletBalance: 0, // Saca tudo
          pixKey: cpfPix, // Salva o CPF como última chave usada
          pixKeyType: "CPF",
        },
      });
    });

    revalidatePath("/dashboard/financeiro");
    return {
      success: true,
      data: "Solicitação enviada! Pagamento em até 24h úteis.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro ao processar saque.",
    };
  }
}
