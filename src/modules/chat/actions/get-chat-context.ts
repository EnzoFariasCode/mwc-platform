"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function getProjectContext(
  projectId: string
): Promise<ActionResponse<{ title: string; budgetLabel: string; status: string } | null>> {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { title: true, budgetLabel: true, status: true },
    });
    return { success: true, data: project };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}

export async function getBasicUserInfo(
  userId: string
): Promise<ActionResponse<{ name: string | null; jobTitle: string | null; id: string } | null>> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, jobTitle: true, id: true },
    });
    return { success: true, data: user };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}
