"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getAdminWithdrawals() {
  await requireAdminUser();

  const withdrawals = await db.withdrawalRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      amount: true,
      pixKey: true,
      pixKeyType: true,
      status: true,
      createdAt: true,
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
            entityId: string;
            action: string;
            reason: string | null;
            receiptUrl: string | null;
            createdAt: Date;
            actorName: string | null;
            actorEmail: string | null;
          }>
        >`
          SELECT DISTINCT ON (audit."entityId")
            audit."entityId",
            audit."action",
            audit."reason",
            audit."receiptUrl",
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

  return withdrawals.map((withdrawal) => ({
    ...withdrawal,
    auditLog: auditByWithdrawalId.get(withdrawal.id) ?? null,
  }));
}

export const getPendingWithdrawals = getAdminWithdrawals;
