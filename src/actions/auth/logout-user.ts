// src/actions/auth/logout-user.ts
"use server";

import { cookies } from "next/headers";
import { ActionResponse } from "@/types/user-types";

export async function logoutUser(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();

    // ANTES: cookieStore.delete("userId");
    // AGORA: Deletamos o cookie "session" (onde fica o Token Seguro)
    cookieStore.delete("session");

    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: "Falha ao desconectar." };
  }
}
