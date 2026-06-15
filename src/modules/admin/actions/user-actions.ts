"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Industry, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  industry: Industry;
  isActive: boolean;
  createdAt: Date;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdminUser();

  return await db.$queryRaw<AdminUserRow[]>`
    SELECT
      id,
      name,
      email,
      "userType",
      industry,
      "isActive",
      "createdAt"
    FROM "User"
    ORDER BY "createdAt" DESC
    LIMIT 50
  `;
}

export async function toggleUserStatus(
  userId: string,
): Promise<ActionResponse<{ isActive: boolean }>> {
  const admin = await requireAdminUser();

  if (!userId) {
    return { success: false, error: "Usuario invalido." };
  }

  if (userId === admin.id) {
    return {
      success: false,
      error: "Voce nao pode suspender a propria conta admin.",
    };
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: string; isActive: boolean }>>`
        SELECT id, "isActive"
        FROM "User"
        WHERE id = ${userId}
        LIMIT 1
      `;

      const user = users[0];

      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      const nextStatus = !user.isActive;

      await tx.$executeRaw`
        UPDATE "User"
        SET "isActive" = ${nextStatus}, "updatedAt" = NOW()
        WHERE id = ${user.id}
      `;

      return { isActive: nextStatus };
    });

    revalidatePath("/dashboard/admin/usuarios");

    return { success: true, data: { isActive: updated.isActive } };
  } catch (error) {
    console.error("[TOGGLE_ADMIN_USER_STATUS_ERROR]", error);
    return {
      success: false,
      error: "Nao foi possivel atualizar o status do usuario.",
    };
  }
}
