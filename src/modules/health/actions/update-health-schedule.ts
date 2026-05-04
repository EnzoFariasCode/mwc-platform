"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// 1. TIPAGEM ESTRITA (Ação do QA e Back-end para acabar com o 'any')
export type DaySchedule = {
  active: boolean;
  start: string;
  end: string;
};

export type WeeklyAvailability = {
  segunda: DaySchedule;
  terca: DaySchedule;
  quarta: DaySchedule;
  quinta: DaySchedule;
  sexta: DaySchedule;
  sabado: DaySchedule;
  domingo: DaySchedule;
};

export async function updateHealthSchedule(scheduleData: WeeklyAvailability) {
  const session = await auth();

  // 2. TRAVA DE SEGURANÇA MÁXIMA (Só Profissional da Saúde passa)
  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return {
      error:
        "Acesso negado. Apenas profissionais de saúde podem editar a agenda.",
    };
  }

  // 3. VALIDAÇÃO DE PAYLOAD (Garante que a estrutura JSON está correta)
  if (
    !scheduleData ||
    typeof scheduleData !== "object" ||
    !scheduleData.segunda
  ) {
    return { error: "Formato de agenda inválido." };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        // O Prisma aceita qualquer JSON, mas o TS garante que scheduleData é WeeklyAvailability
        availability: scheduleData as any,
      },
    });

    // Limpa o cache do dashboard e já deixa preparado para limpar o perfil público
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    return { error: "Erro interno ao salvar os horários." };
  }
}
