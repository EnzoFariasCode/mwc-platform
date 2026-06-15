"use server";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";

export async function getPendingWithdrawals() {
  await requireAdminUser();

  return await db.withdrawalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
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
