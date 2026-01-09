// src/actions/logout-user.ts
"use server";

import { cookies } from "next/headers";
import { ActionResponse } from "@/types/user-types";

export async function logoutUser(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("userId");
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: "Falha ao desconectar." };
  }
}
