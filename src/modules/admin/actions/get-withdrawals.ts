"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";

export async function getAdminWithdrawals() {
  await requireAdminUser();

  return await db.withdrawalRequest.findMany({
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
}

export const getPendingWithdrawals = getAdminWithdrawals;
