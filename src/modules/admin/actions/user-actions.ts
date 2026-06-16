"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Industry, Prisma, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  industry: Industry;
  isActive: boolean;
  createdAt: Date;
  auditLog: {
    id: string;
    action: string;
    reason: string | null;
    createdAt: Date;
    actorName: string | null;
    actorEmail: string | null;
  } | null;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdminUser();

  const users = await db.$queryRaw<
    Array<Omit<AdminUserRow, "auditLog">>
  >`
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

  const userIds = users.map((user) => user.id);
  const auditLogs =
    userIds.length > 0
      ? await db.$queryRaw<
          Array<{
            id: string;
            entityId: string;
            action: string;
            reason: string | null;
            createdAt: Date;
            actorName: string | null;
            actorEmail: string | null;
          }>
        >`
          SELECT DISTINCT ON (audit."entityId")
            audit."id",
            audit."entityId",
            audit."action",
            audit."reason",
            audit."createdAt",
            actor."name" AS "actorName",
            actor."email" AS "actorEmail"
          FROM "AdminAuditLog" audit
          INNER JOIN "User" actor ON actor."id" = audit."actorId"
          WHERE audit."entityType" = 'USER_ACCOUNT'
            AND audit."entityId" IN (${Prisma.join(userIds)})
          ORDER BY audit."entityId", audit."createdAt" DESC
        `
      : [];

  const auditByUserId = new Map(
    auditLogs.map((auditLog) => [auditLog.entityId, auditLog]),
  );

  return users.map((user) => ({
    ...user,
    auditLog: auditByUserId.get(user.id) ?? null,
  }));
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
      const users = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          email: string;
          userType: UserType;
          industry: Industry;
          isActive: boolean;
        }>
      >`
        SELECT id, name, email, "userType", industry, "isActive"
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

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: nextStatus
          ? "USER_ACCOUNT_REACTIVATED"
          : "USER_ACCOUNT_SUSPENDED",
        entityType: "USER_ACCOUNT",
        entityId: user.id,
        reason: nextStatus
          ? "Conta reativada pelo painel administrativo."
          : "Conta suspensa pelo painel administrativo.",
        receiptUrl: null,
        metadata: {
          targetName: user.name,
          targetEmail: user.email,
          userType: user.userType,
          industry: user.industry,
          previousStatus: user.isActive ? "ACTIVE" : "SUSPENDED",
          nextStatus: nextStatus ? "ACTIVE" : "SUSPENDED",
        },
      });

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
