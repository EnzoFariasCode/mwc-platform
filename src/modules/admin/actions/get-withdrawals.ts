"use server";

import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Prisma, WithdrawalStatus } from "@prisma/client";

export type AdminWithdrawalQuery = {
  page?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

const ADMIN_WITHDRAWALS_PAGE_SIZE = 25;

function dateBoundary(value: string | undefined, endExclusive = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (endExclusive) parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed;
}

export async function getAdminWithdrawals(query: AdminWithdrawalQuery = {}) {
  await requireAdminRole(["OWNER", "FINANCE"]);

  const requestedPage = Math.max(1, Math.trunc(query.page || 1));
  const search = query.search?.trim().slice(0, 200) || "";
  const status = Object.values(WithdrawalStatus).includes(
    query.status as WithdrawalStatus,
  )
    ? (query.status as WithdrawalStatus)
    : undefined;
  const baseWhere: Prisma.WithdrawalRequestWhereInput = {
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { pixKey: { contains: search, mode: "insensitive" } },
            { pixKeyType: { contains: search, mode: "insensitive" } },
            { transactionId: { contains: search, mode: "insensitive" } },
            { providerRef: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
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
  const where: Prisma.WithdrawalRequestWhereInput = {
    ...baseWhere,
    ...(status ? { status } : {}),
  };
  const [totalItems, grouped] = await Promise.all([
    db.withdrawalRequest.count({ where }),
    db.withdrawalRequest.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ADMIN_WITHDRAWALS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, totalPages);
  const withdrawals = await db.withdrawalRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_WITHDRAWALS_PAGE_SIZE,
    take: ADMIN_WITHDRAWALS_PAGE_SIZE,
    select: {
      id: true,
      amount: true,
      pixKey: true,
      pixKeyType: true,
      status: true,
      createdAt: true,
      requestedAt: true,
      dueAt: true,
      processedAt: true,
      failedAt: true,
      failureReason: true,
      providerRef: true,
      transactionId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          walletBalance: true,
        },
      },
    },
  });

  const withdrawalIds = withdrawals.map((withdrawal) => withdrawal.id);
  const auditLogs =
    withdrawalIds.length > 0
      ? await db.$queryRaw<
          Array<{
            id: string;
            entityId: string;
            action: string;
            reason: string | null;
            receiptUrl: string | null;
            receiptFileName: string | null;
            receiptFileType: string | null;
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
            audit."receiptUrl",
            audit."receiptFileName",
            audit."receiptFileType",
            audit."createdAt",
            actor."name" AS "actorName",
            actor."email" AS "actorEmail"
          FROM "AdminAuditLog" audit
          INNER JOIN "User" actor ON actor."id" = audit."actorId"
          WHERE audit."entityType" = 'WITHDRAWAL_REQUEST'
            AND audit."entityId" IN (${Prisma.join(withdrawalIds)})
          ORDER BY audit."entityId", audit."createdAt" DESC
        `
      : [];
  const auditByWithdrawalId = new Map(
    auditLogs.map((auditLog) => [auditLog.entityId, auditLog]),
  );

  const statusCounts = Object.fromEntries(
    Object.values(WithdrawalStatus).map((item) => [item, 0]),
  ) as Record<WithdrawalStatus, number>;
  for (const group of grouped) statusCounts[group.status] = group._count._all;
  const pendingGroups = grouped.filter(
    (group) =>
      group.status === WithdrawalStatus.PENDING ||
      group.status === WithdrawalStatus.PROCESSING,
  );
  const completedGroup = grouped.find(
    (group) => group.status === WithdrawalStatus.COMPLETED,
  );

  return {
    items: withdrawals.map((withdrawal) => ({
      ...withdrawal,
      auditLog: auditByWithdrawalId.get(withdrawal.id) ?? null,
    })),
    pagination: {
      page,
      pageSize: ADMIN_WITHDRAWALS_PAGE_SIZE,
      totalItems,
      totalPages,
    },
    summary: {
      statusCounts,
      pendingCount: pendingGroups.reduce(
        (total, group) => total + group._count._all,
        0,
      ),
      pendingAmount: pendingGroups
        .reduce(
          (total, group) => total.add(group._sum.amount ?? 0),
          new Prisma.Decimal(0),
        )
        .toNumber(),
      completedAmount: (completedGroup?._sum.amount ?? new Prisma.Decimal(0)).toNumber(),
    },
  };
}

export const getPendingWithdrawals = getAdminWithdrawals;
