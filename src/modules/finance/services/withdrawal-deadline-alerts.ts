import "server-only";

import { db } from "@/lib/prisma";
import { sendAdminNotification } from "@/modules/admin/services/admin-notification-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

export async function processWithdrawalDeadlineAlerts() {
  const now = new Date();
  const dueSoonLimit = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const activeStatuses = ["PENDING", "PROCESSING"] as const;

  const [dueSoon, overdue, admins] = await Promise.all([
    db.withdrawalRequest.findMany({
      where: {
        status: { in: [...activeStatuses] },
        dueAt: { gt: now, lte: dueSoonLimit },
        dueSoonNotifiedAt: null,
      },
      select: { id: true, userId: true, dueAt: true, amount: true },
    }),
    db.withdrawalRequest.findMany({
      where: {
        status: { in: [...activeStatuses] },
        dueAt: { lte: now },
        overdueNotifiedAt: null,
      },
      select: { id: true, userId: true, dueAt: true, amount: true },
    }),
    db.user.findMany({
      where: { userType: "ADMIN", isActive: true },
      select: { id: true },
    }),
  ]);

  for (const withdrawal of dueSoon) {
    await db.withdrawalRequest.updateMany({
      where: { id: withdrawal.id, dueSoonNotifiedAt: null },
      data: { dueSoonNotifiedAt: now },
    });

    await Promise.all([
      upsertNotification({
        userId: withdrawal.userId,
        type: "INFO",
        eventType: "WITHDRAWAL_DUE_SOON",
        title: "Saque proximo do prazo",
        message: `O prazo informado para pagamento termina em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
        link: "/dashboard/financeiro",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
      }),
      ...admins.map((admin) =>
        upsertNotification({
          userId: admin.id,
          type: "WARNING",
          eventType: "WITHDRAWAL_DUE_SOON",
          title: "Saque proximo do vencimento",
          message: `O saque ${withdrawal.id} vence em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
          link: "/dashboard/admin/financeiro",
          entityType: "WITHDRAWAL_REQUEST",
          entityId: withdrawal.id,
        }),
      ),
    ]);
  }

  for (const withdrawal of overdue) {
    await db.withdrawalRequest.updateMany({
      where: { id: withdrawal.id, overdueNotifiedAt: null },
      data: { overdueNotifiedAt: now },
    });

    await Promise.all([
      upsertNotification({
        userId: withdrawal.userId,
        type: "WARNING",
        eventType: "WITHDRAWAL_OVERDUE",
        title: "Prazo do saque excedido",
        message:
          "O prazo informado para pagamento foi excedido. A equipe financeira foi alertada.",
        link: "/dashboard/financeiro",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
      }),
      ...admins.map((admin) =>
        upsertNotification({
          userId: admin.id,
          type: "WARNING",
          eventType: "WITHDRAWAL_OVERDUE",
          title: "Saque vencido",
          message: `O saque ${withdrawal.id} ultrapassou o prazo em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
          link: "/dashboard/admin/financeiro",
          entityType: "WITHDRAWAL_REQUEST",
          entityId: withdrawal.id,
        }),
      ),
      sendAdminNotification({
        subject: "MWC Admin - Saque fora do prazo",
        lines: [
          `Saque: ${withdrawal.id}`,
          `Vencimento: ${withdrawal.dueAt.toLocaleDateString("pt-BR")}`,
          `Valor: ${withdrawal.amount.toString()}`,
        ],
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/financeiro`,
      }),
    ]);
  }

  return { dueSoon: dueSoon.length, overdue: overdue.length };
}
