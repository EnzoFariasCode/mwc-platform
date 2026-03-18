"use server";

import { ActionResponse } from "@/modules/users/types/user-types";
import { signOut } from "@/auth";

export async function logoutUser(): Promise<ActionResponse> {
  try {
    await signOut({ redirect: false });
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: "Falha ao desconectar." };
  }
}
