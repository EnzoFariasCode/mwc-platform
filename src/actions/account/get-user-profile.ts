// src/actions/get-user-profile.ts
"use server";

import { cookies } from "next/headers";
import { findProfileById } from "@/services/user-service";
import { ActionResponse, UserProfileDTO } from "@/types/user-types";

export async function getUserProfile(): Promise<
  ActionResponse<UserProfileDTO>
> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    // 1. Validação
    if (!userId) {
      return { success: false, error: "Sessão expirada ou inválida." };
    }

    // 2. Chamada ao Serviço
    const user = await findProfileById(userId);

    if (!user) {
      return { success: false, error: "Perfil não encontrado." };
    }

    // 3. Sucesso
    return {
      success: true,
      data: user,
    };
  } catch (error) {
    // Log apenas no servidor para não vazar info sensível
    console.error("Erro na action getUserProfile:", error);
    return { success: false, error: "Erro interno ao carregar dados." };
  }
}
