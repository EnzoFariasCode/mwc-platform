"use server";

import { ActionResponse } from "@/types/user-types";
import { deleteSession } from "@/lib/auth"; // Importa do centralizador

export async function logoutUser(): Promise<ActionResponse> {
  try {
    await deleteSession(); // Usa a função padrão
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: "Falha ao desconectar." };
  }
}
