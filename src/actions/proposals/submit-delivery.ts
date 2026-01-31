"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitDelivery(
  projectId: string,
  link: string,
  description: string
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Cria o registro da entrega
    await db.deliverable.create({
      data: {
        projectId,
        link,
        description,
        senderId: userId, // <--- A CORREÇÃO ESTÁ AQUI (Adicionamos o ID de quem enviou)
      },
    });

    // 2. Muda o status do projeto para 'Em Análise' (O cliente precisa aprovar)
    await db.project.update({
      where: { id: projectId },
      data: { status: "UNDER_REVIEW" },
    });

    revalidatePath("/dashboard/projetos-ativos");
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao entregar projeto:", error);
    return { success: false, error: "Erro ao enviar entrega." };
  }
}
