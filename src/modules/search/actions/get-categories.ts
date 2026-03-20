"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function getCategories(): Promise<ActionResponse<string[]>> {
  try {
    // Busca todos os usuários profissionais que têm um cargo definido
    const professionals = await db.user.findMany({
      where: {
        userType: "PROFESSIONAL",
        jobTitle: { not: null }, // Garante que não pega nulos
      },
      select: {
        jobTitle: true,
      },
      distinct: ["jobTitle"], // O "distinct" garante que não venha repetido
    });

    // Mapeia apenas os nomes e filtra vazios
    const categories = professionals
      .map((p) => p.jobTitle)
      .filter((title): title is string => !!title && title.trim() !== "");

    return { success: true, data: categories.sort() };
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return { success: false, error: "Erro ao buscar categorias." };
  }
}
