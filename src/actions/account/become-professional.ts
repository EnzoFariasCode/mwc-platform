"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function becomeProfessional() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return;

  try {
    // 1. Atualiza o tipo do usuário
    await db.user.update({
      where: { id: userId },
      data: { userType: "PROFESSIONAL" },
    });

    // 2. Revalida o layout para atualizar a sidebar
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Erro ao virar profissional:", error);
    return { error: "Erro ao atualizar perfil." };
  }

  // 3. Redireciona para o perfil para completar o cadastro
  redirect("/dashboard/perfil");
}
