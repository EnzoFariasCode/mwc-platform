"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateHealthProProfile(formData: FormData) {
  const session = await auth();

  // Trava de Segurança do DevOps: Só passa se estiver logado e for profissional de saúde
  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Não autorizado" };
  }

  // Puxando os dados que vieram do formulário (Front-end)
  const jobTitle = formData.get("jobTitle") as string;
  const documentReg = formData.get("documentReg") as string;
  const approach = formData.get("approach") as string;
  const sessionDuration = formData.get("sessionDuration");
  const consultationFee = formData.get("consultationFee");
  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;

  try {
    // Salvando no banco de dados (Ação do Back-end)
    await db.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName || null,
        bio: bio || null,
        jobTitle: jobTitle || null,
        documentReg: documentReg || null,
        approach: approach || null,
        // Converte para Inteiro e Decimal para o Prisma não reclamar
        sessionDuration: sessionDuration
          ? parseInt(sessionDuration as string, 10)
          : 50,
        consultationFee: consultationFee
          ? parseFloat(consultationFee as string)
          : null,
      },
    });

    // Limpando o cache para a tela atualizar instantaneamente (Ação de Performance)
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil clínico:", error);
    return { error: "Erro interno ao salvar dados" };
  }
}
