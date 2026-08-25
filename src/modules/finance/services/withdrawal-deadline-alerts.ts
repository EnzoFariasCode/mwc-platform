import "server-only";

import { db } from "@/lib/prisma";
import { enqueueAdminNotificationEmails } from "@/modules/email/services/admin-finance-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

export async function processWithdrawalDeadlineAlerts() {
  const now = new Date();
  const dueSoonLimit = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const activeStatuses = ["PENDING", "PROCESSING"] as const;

  const [dueSoon, overdue] = await Promise.all([
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
  ]);

  for (const withdrawal of dueSoon) {
    await db.$transaction(async (tx) => {
      const claimed = await tx.withdrawalRequest.updateMany({
        where: { id: withdrawal.id, dueSoonNotifiedAt: null },
        data: { dueSoonNotifiedAt: now },
      });
      if (claimed.count !== 1) return;

      await upsertNotification({
        userId: withdrawal.userId,
        type: "INFO",
        eventType: "WITHDRAWAL_DUE_SOON",
        title: "Saque proximo do prazo",
        message: `O prazo informado para pagamento termina em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
        link: "/dashboard/financeiro",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
      }, tx);
      const admins = await tx.user.findMany({
        where: { userType: "ADMIN", isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        await upsertNotification({
          userId: admin.id,
          type: "WARNING",
          eventType: "WITHDRAWAL_DUE_SOON",
          title: "Saque proximo do vencimento",
          message: `O saque ${withdrawal.id} vence em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
          link: "/dashboard/admin/financeiro",
          entityType: "WITHDRAWAL_REQUEST",
          entityId: withdrawal.id,
        }, tx);
      }
    });
  }

  for (const withdrawal of overdue) {
    await db.$transaction(async (tx) => {
      const claimed = await tx.withdrawalRequest.updateMany({
        where: { id: withdrawal.id, overdueNotifiedAt: null },
        data: { overdueNotifiedAt: now },
      });
      if (claimed.count !== 1) return;

      await upsertNotification({
        userId: withdrawal.userId,
        type: "WARNING",
        eventType: "WITHDRAWAL_OVERDUE",
        title: "Prazo do saque excedido",
        message:
          "O prazo informado para pagamento foi excedido. A equipe financeira foi alertada.",
        link: "/dashboard/financeiro",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
      }, tx);
      await enqueueAdminNotificationEmails(tx, {
        eventType: "ADMIN_WITHDRAWAL_OVERDUE",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: withdrawal.id,
        templateKey: "admin.critical.alert",
        roles: ["OWNER", "FINANCE"],
        title: "Saque fora do prazo",
        summary: "Um saque ultrapassou o prazo operacional informado.",
        lines: [
          "Um saque ultrapassou o prazo operacional informado.",
          "A tesouraria deve revisar o caso com prioridade.",
        ],
        details: [
          { label: "Saque", value: withdrawal.id },
          {
            label: "Vencimento",
            value: withdrawal.dueAt.toLocaleDateString("pt-BR"),
          },
          { label: "Valor", value: withdrawal.amount.toString() },
        ],
        actionPath: "/dashboard/admin/financeiro",
        priority: 5,
        notification: {
          title: "Saque vencido",
          message: `O saque ${withdrawal.id} ultrapassou o prazo em ${withdrawal.dueAt.toLocaleDateString("pt-BR")}.`,
        },
      });
    });
  }

  return { dueSoon: dueSoon.length, overdue: overdue.length };
}
