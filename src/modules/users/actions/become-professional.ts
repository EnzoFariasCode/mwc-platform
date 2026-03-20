"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserType } from "@prisma/client";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";

interface BecomeProfessionalData {
  jobTitle: string;
  yearsOfExperience: number;
}

export async function becomeProfessional(
  data: BecomeProfessionalData
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (existingUser?.userType === UserType.PROFESSIONAL) {
      return { success: false, error: "Você já é um profissional cadastrado." };
    }

    if (!data.jobTitle) {
      return { success: false, error: "Profissão é obrigatória." };
    }

    await db.user.update({
      where: { id: userId },
      data: {
        userType: UserType.PROFESSIONAL,
        jobTitle: data.jobTitle,
        yearsOfExperience: data.yearsOfExperience,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Erro ao virar profissional:", error);
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}
