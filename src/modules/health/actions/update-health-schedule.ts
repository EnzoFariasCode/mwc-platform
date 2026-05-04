"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateHealthSchedule(scheduleData: any) {
  const session = await auth();

  if (!session?.user?.id || session.user.userType !== "PROFESSIONAL") {
    return { error: "Não autorizado" };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        availability: scheduleData,
      },
    });

    revalidatePath("/agendar-consulta/dashboard-profissional");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    return { error: "Erro interno ao salvar os horários." };
  }
}
