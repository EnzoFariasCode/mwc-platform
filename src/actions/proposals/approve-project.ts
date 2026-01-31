"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function approveProject(projectId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Não autorizado" };

    // 1. Verifica se o projeto existe e se o usuário é o dono
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return { success: false, error: "Projeto não encontrado" };
    if (project.ownerId !== userId) {
      return { success: false, error: "Apenas o dono pode aprovar a entrega." };
    }

    // 2. Finaliza o projeto
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "COMPLETED",
        // Aqui você poderia adicionar um campo completedAt: new Date() se tiver no schema
      },
    });

    // 3. (Futuro) Aqui entraria a lógica de liberar o saldo na tabela 'Wallet' do profissional

    revalidatePath("/dashboard/meus-projetos");
    revalidatePath("/dashboard/projetos-ativos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao aprovar projeto:", error);
    return { success: false, error: "Erro ao finalizar projeto." };
  }
}
