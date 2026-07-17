"use server";

import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Industry, Prisma, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { createAdminAuditLog } from "./audit-log";

type AdminRoleValue = "OWNER" | "FINANCE" | "SUPPORT";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  industry: Industry;
  adminRole: "OWNER" | "FINANCE" | "SUPPORT" | null;
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

export type AdminUserQuery = {
  page?: number;
  search?: string;
  userType?: string;
  industry?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

const ADMIN_USERS_PAGE_SIZE = 25;

function dateBoundary(value: string | undefined, endExclusive = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (endExclusive) parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed;
}

function isAdminRoleValue(value: string): value is AdminRoleValue {
  return ["OWNER", "FINANCE", "SUPPORT"].includes(value);
}

export async function getAdminUsers(query: AdminUserQuery = {}) {
  await requireAdminRole(["OWNER", "SUPPORT"]);

  const requestedPage = Math.max(1, Math.trunc(query.page || 1));
  const search = query.search?.trim().slice(0, 200) || "";
  const userType = Object.values(UserType).includes(query.userType as UserType)
    ? (query.userType as UserType)
    : undefined;
  const industry = Object.values(Industry).includes(query.industry as Industry)
    ? (query.industry as Industry)
    : undefined;
  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(userType ? { userType } : {}),
    ...(industry ? { industry } : {}),
    ...(query.status === "ACTIVE"
      ? { isActive: true }
      : query.status === "SUSPENDED"
        ? { isActive: false }
        : {}),
    createdAt: {
      ...(dateBoundary(query.dateFrom)
        ? { gte: dateBoundary(query.dateFrom) }
        : {}),
      ...(dateBoundary(query.dateTo, true)
        ? { lt: dateBoundary(query.dateTo, true) }
        : {}),
    },
  };

  const totalItems = await db.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_USERS_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const users = await db.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
    take: ADMIN_USERS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      userType: true,
      industry: true,
      adminRole: true,
      isActive: true,
      createdAt: true,
    },
  });

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

  return {
    items: users.map((user) => ({
      ...user,
      auditLog: auditByUserId.get(user.id) ?? null,
    })) satisfies AdminUserRow[],
    pagination: {
      page,
      pageSize: ADMIN_USERS_PAGE_SIZE,
      totalItems,
      totalPages,
    },
  };
}

export async function toggleUserStatus(
  userId: string,
): Promise<ActionResponse<{ isActive: boolean }>> {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);

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
          adminRole: "OWNER" | "FINANCE" | "SUPPORT" | null;
          isActive: boolean;
        }>
      >`
        SELECT id, name, email, "userType", industry, "adminRole", "isActive"
        FROM "User"
        WHERE id = ${userId}
        LIMIT 1
      `;

      const user = users[0];

      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      if (user.userType === "ADMIN" && admin.adminRole !== "OWNER") {
        throw new Error("Apenas OWNER pode alterar contas administrativas.");
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
          adminRole: user.adminRole,
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

export async function updateAdminRole(
  userId: string,
  adminRole: AdminRoleValue,
): Promise<ActionResponse<{ adminRole: AdminRoleValue }>> {
  const admin = await requireAdminRole(["OWNER"]);

  if (!userId) {
    return { success: false, error: "Usuario invalido." };
  }

  if (!isAdminRoleValue(adminRole)) {
    return { success: false, error: "Papel administrativo invalido." };
  }

  try {
    await db.$transaction(async (tx) => {
      const users = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          email: string;
          userType: UserType;
          adminRole: AdminRoleValue | null;
        }>
      >`
        SELECT id, name, email, "userType", "adminRole"
        FROM "User"
        WHERE id = ${userId}
        LIMIT 1
      `;

      const user = users[0];

      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      if (user.userType !== "ADMIN") {
        throw new Error("Apenas contas admin podem receber papel admin.");
      }

      if (user.id === admin.id && adminRole !== "OWNER") {
        throw new Error("Voce nao pode remover seu proprio acesso OWNER.");
      }

      await tx.$executeRaw`
        UPDATE "User"
        SET "adminRole" = ${adminRole}::"AdminRole", "updatedAt" = NOW()
        WHERE id = ${user.id}
      `;

      await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "ADMIN_ROLE_UPDATED",
        entityType: "USER_ACCOUNT",
        entityId: user.id,
        reason: "Papel administrativo atualizado pelo painel.",
        receiptUrl: null,
        metadata: {
          targetName: user.name,
          targetEmail: user.email,
          previousAdminRole: user.adminRole ?? "OWNER",
          nextAdminRole: adminRole,
        },
      });
    });

    revalidatePath("/dashboard/admin/usuarios");

    return { success: true, data: { adminRole } };
  } catch (error) {
    console.error("[UPDATE_ADMIN_ROLE_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o papel admin.",
    };
  }
}
