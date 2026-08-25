import "server-only";

import type { NotificationType, Prisma } from "@prisma/client";

import {
  normalizeAdminRole,
  type AdminRole,
} from "@/modules/admin/lib/admin-permissions";
import type { AdminFinanceEmailTemplateKey } from "@/modules/email/templates/admin-finance-emails";
import { enqueueTransactionalEmail } from "@/modules/email/services/email-outbox-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

type AdminFinanceEmailClient = Prisma.TransactionClient;

export type AdminFinanceRecipient = {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
};

type EmailContent = {
  title: string;
  preview: string;
  lines: string[];
  details?: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionPath: string;
  attachmentAuditLogId?: string;
};

function recipientName(recipient: AdminFinanceRecipient) {
  return recipient.displayName || recipient.name || null;
}

export function enqueueAdminFinanceEmail(
  client: AdminFinanceEmailClient,
  input: {
    idempotencyKey: string;
    eventType: string;
    templateKey: AdminFinanceEmailTemplateKey;
    recipient: AdminFinanceRecipient;
    entityType: string;
    entityId: string;
    content: EmailContent;
    priority?: number;
  },
) {
  return enqueueTransactionalEmail(client, {
    idempotencyKey: input.idempotencyKey,
    eventType: input.eventType,
    templateKey: input.templateKey,
    templateVersion: 1,
    recipientUserId: input.recipient.id,
    recipientEmail: input.recipient.email,
    recipientName: recipientName(input.recipient),
    entityType: input.entityType,
    entityId: input.entityId,
    priority: input.priority,
    payload: {
      recipientName: recipientName(input.recipient),
      title: input.content.title,
      preview: input.content.preview,
      lines: input.content.lines,
      details: input.content.details ?? [],
      actionLabel: input.content.actionLabel,
      actionPath: input.content.actionPath,
      ...(input.content.attachmentAuditLogId
        ? { attachmentAuditLogId: input.content.attachmentAuditLogId }
        : {}),
    },
  });
}

export async function enqueueAdminNotificationEmails(
  client: AdminFinanceEmailClient,
  input: {
    eventType: string;
    entityType: string;
    entityId: string;
    templateKey?: AdminFinanceEmailTemplateKey;
    roles?: AdminRole[];
    title: string;
    summary: string;
    lines: string[];
    details?: Array<{ label: string; value: string }>;
    actionPath: string;
    actionLabel?: string;
    priority?: number;
    actorId?: string;
    notification?: {
      title?: string;
      message?: string;
      type?: NotificationType;
      metadata?: Prisma.InputJsonValue;
    };
  },
) {
  const roles = input.roles ?? ["OWNER", "FINANCE", "SUPPORT"];
  const admins = await client.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      adminRole: true,
    },
  });
  const recipients = admins.filter((admin) =>
    roles.includes(
      normalizeAdminRole({
        userType: "ADMIN",
        adminRole: admin.adminRole,
      })!,
    ),
  );

  for (const admin of recipients) {
    if (input.notification) {
      await upsertNotification(
        {
          userId: admin.id,
          actorId: input.actorId,
          type: input.notification.type ?? "WARNING",
          eventType: input.eventType,
          title: input.notification.title ?? input.title,
          message: input.notification.message ?? input.summary,
          link: input.actionPath,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.notification.metadata,
        },
        client,
      );
    }

    await enqueueAdminFinanceEmail(client, {
      idempotencyKey: `${input.eventType}:${input.entityType}:${input.entityId}:${admin.id}`,
      eventType: input.eventType,
      templateKey: input.templateKey ?? "admin.critical.alert",
      recipient: admin,
      entityType: input.entityType,
      entityId: input.entityId,
      priority: input.priority ?? 20,
      content: {
        title: input.title,
        preview: input.summary,
        lines: input.lines,
        details: input.details,
        actionLabel: input.actionLabel ?? "Abrir painel",
        actionPath: input.actionPath,
      },
    });
  }

  return recipients.length;
}

export function enqueueWithdrawalRequestedEmail(
  client: AdminFinanceEmailClient,
  input: {
    withdrawalId: string;
    recipient: AdminFinanceRecipient;
    amount: string;
    pixKey: string;
    pixKeyType: string;
    dueAt: string;
    actionPath: string;
  },
) {
  return enqueueAdminFinanceEmail(client, {
    idempotencyKey: `FINANCE_WITHDRAWAL_REQUESTED:${input.withdrawalId}:${input.recipient.id}`,
    eventType: "FINANCE_WITHDRAWAL_REQUESTED",
    templateKey: "finance.withdrawal.requested",
    recipient: input.recipient,
    entityType: "WITHDRAWAL_REQUEST",
    entityId: input.withdrawalId,
    content: {
      title: "Solicitacao de saque Pix recebida",
      preview: "Recebemos sua solicitacao de saque Pix.",
      lines: [
        "Recebemos sua solicitacao de saque Pix.",
        "O valor ja foi reservado do saldo disponivel e aguarda o pagamento manual pela tesouraria.",
      ],
      details: [
        { label: "Valor liquido", value: input.amount },
        { label: "Chave Pix", value: `${input.pixKeyType} - ${input.pixKey}` },
        { label: "Prazo estimado", value: input.dueAt },
      ],
      actionLabel: "Acompanhar saque",
      actionPath: input.actionPath,
    },
  });
}

export function enqueueWithdrawalPaidEmail(
  client: AdminFinanceEmailClient,
  input: {
    idempotencyKey: string;
    eventType?: string;
    withdrawalId: string;
    recipient: AdminFinanceRecipient;
    amount: string;
    pixKey: string;
    pixKeyType: string;
    providerRef: string;
    processedAt: string;
    receiptAuditLogId: string;
    actionPath: string;
  },
) {
  return enqueueAdminFinanceEmail(client, {
    idempotencyKey: input.idempotencyKey,
    eventType: input.eventType ?? "FINANCE_WITHDRAWAL_PAID",
    templateKey: "finance.withdrawal.paid",
    recipient: input.recipient,
    entityType: "WITHDRAWAL_REQUEST",
    entityId: input.withdrawalId,
    priority: 30,
    content: {
      title: "Saque Pix pago",
      preview: "Seu saque foi pago e o comprovante esta anexado.",
      lines: [
        "Seu saque Pix foi pago.",
        "O comprovante da transferencia esta anexado a este e-mail.",
      ],
      details: [
        { label: "Valor", value: input.amount },
        { label: "Chave Pix", value: `${input.pixKeyType} - ${input.pixKey}` },
        { label: "Identificacao", value: input.providerRef },
        { label: "Pagamento confirmado em", value: input.processedAt },
      ],
      actionLabel: "Abrir financeiro",
      actionPath: input.actionPath,
      attachmentAuditLogId: input.receiptAuditLogId,
    },
  });
}
