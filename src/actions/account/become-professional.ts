"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { UserType } from "@prisma/client";
import { verifySession } from "@/lib/auth"; // <--- Importante: Segurança JWT

export async function becomeProfessional() {
  try {
    const cookieStore = await cookies();

    // 1. LÓGICA NOVA DE AUTH (JWT)
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 2. Atualiza o usuário no Banco
    await db.user.update({
      where: { id: userId },
      data: {
        userType: UserType.PROFESSIONAL,
      },
    });

    // 3. Atualiza as caches para o Header/Sidebar mudarem imediatamente
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao virar profissional:", error);
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}
