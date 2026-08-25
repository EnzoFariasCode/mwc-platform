import "server-only";

import { EmailOutboxStatus, type EmailOutbox } from "@prisma/client";

import { db } from "@/lib/prisma";
import type { TechEmailTemplateKey } from "@/modules/email/templates/tech-emails";
import {
  enqueueTransactionalEmail,
  type EmailOutboxDatabaseClient,
} from "./email-outbox-service";

export const TECH_CHAT_EMAIL_DELAY_MS = 5 * 60 * 1000;

type TechEmailRecipient = {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
};

type TechEmailContent = {
  title: string;
  preview: string;
  lines: string[];
  details?: Array<{ label: string; value: string }>;
  actionLabel: string;
  actionPath: string;
};

export type QueueTechEmailInput = {
  idempotencyKey: string;
  eventType: string;
  templateKey: TechEmailTemplateKey;
  recipient: TechEmailRecipient;
  entityType: "CONVERSATION" | "TECH_PROJECT";
  entityId: string;
  content: TechEmailContent;
  nextAttemptAt?: Date;
  priority?: number;
};

function recipientName(recipient: TechEmailRecipient) {
  return recipient.displayName || recipient.name || null;
}

export function enqueueTechEmail(
  client: EmailOutboxDatabaseClient,
  input: QueueTechEmailInput,
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
    payload: {
      recipientName: recipientName(input.recipient),
      title: input.content.title,
      preview: input.content.preview,
      lines: input.content.lines,
      details: input.content.details ?? [],
      actionLabel: input.content.actionLabel,
      actionPath: input.content.actionPath,
    },
    nextAttemptAt: input.nextAttemptAt,
    priority: input.priority,
  });
}

export async function enqueueTechChatUnreadEmail(
  client: EmailOutboxDatabaseClient,
  input: {
    conversationId: string;
    firstUnreadMessageId: string;
    firstUnreadAt: Date;
    recipient: TechEmailRecipient;
    senderId: string;
    senderName: string;
  },
) {
  const idempotencyKey = [
    "TECH_CHAT_UNREAD",
    input.conversationId,
    input.recipient.id,
    input.firstUnreadMessageId,
  ].join(":");

  const existing = await client.emailOutbox.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return { email: existing, created: false } as const;

  return enqueueTechEmail(client, {
    idempotencyKey,
    eventType: "TECH_CHAT_UNREAD",
    templateKey: "tech.chat.unread",
    recipient: input.recipient,
    entityType: "CONVERSATION",
    entityId: input.conversationId,
    nextAttemptAt: new Date(
      input.firstUnreadAt.getTime() + TECH_CHAT_EMAIL_DELAY_MS,
    ),
    priority: 80,
    content: {
      title: "Mensagens nao lidas",
      preview: `Voce tem novas mensagens de ${input.senderName}.`,
      lines: [
        `Voce tem novas mensagens de ${input.senderName} no Marketplace Tech.`,
        "As mensagens foram agrupadas neste unico aviso para evitar notificacoes repetidas.",
      ],
      actionLabel: "Abrir conversa",
      actionPath: `/dashboard/chat?newChat=${encodeURIComponent(input.senderId)}`,
    },
  });
}

export function enqueueTechChatStartedEmail(
  client: EmailOutboxDatabaseClient,
  input: {
    conversationId: string;
    createdAt: Date;
    recipient: TechEmailRecipient;
    starterId: string;
    starterName: string;
  },
) {
  return enqueueTechEmail(client, {
    idempotencyKey: `TECH_CHAT_STARTED:${input.conversationId}:${input.recipient.id}`,
    eventType: "TECH_CHAT_STARTED",
    templateKey: "tech.chat.started",
    recipient: input.recipient,
    entityType: "CONVERSATION",
    entityId: input.conversationId,
    nextAttemptAt: new Date(input.createdAt.getTime() + TECH_CHAT_EMAIL_DELAY_MS),
    priority: 80,
    content: {
      title: "Nova conversa iniciada",
      preview: `${input.starterName} iniciou uma conversa com voce.`,
      lines: [
        `${input.starterName} iniciou uma conversa com voce no Marketplace Tech.`,
        "Se voce ja abriu a conversa, este aviso sera cancelado automaticamente.",
      ],
      actionLabel: "Abrir conversa",
      actionPath: `/dashboard/chat?newChat=${encodeURIComponent(input.starterId)}`,
    },
  });
}

export async function cancelPendingTechChatEmails(
  client: EmailOutboxDatabaseClient,
  input: { conversationId: string; recipientUserId: string; canceledAt?: Date },
) {
  return client.emailOutbox.updateMany({
    where: {
      recipientUserId: input.recipientUserId,
      entityType: "CONVERSATION",
      entityId: input.conversationId,
      eventType: { in: ["TECH_CHAT_UNREAD", "TECH_CHAT_STARTED"] },
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED] },
    },
    data: {
      status: EmailOutboxStatus.CANCELED,
      canceledAt: input.canceledAt ?? new Date(),
      processingStartedAt: null,
      failedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });
}

export async function shouldDeliverTechEmailOutbox(
  email: Pick<EmailOutbox, "eventType" | "entityType" | "entityId" | "recipientUserId">,
) {
  if (
    email.eventType !== "TECH_CHAT_UNREAD" &&
    email.eventType !== "TECH_CHAT_STARTED"
  ) {
    return true;
  }
  if (
    email.entityType !== "CONVERSATION" ||
    !email.entityId ||
    !email.recipientUserId
  ) {
    return false;
  }

  const conversation = await db.conversation.findUnique({
    where: { id: email.entityId },
    select: {
      participantAId: true,
      participantBId: true,
      unreadCountA: true,
      unreadCountB: true,
      deletedByIds: true,
      blocks: {
        select: { id: true },
        take: 1,
      },
    },
  });
  if (
    !conversation ||
    conversation.blocks.length > 0 ||
    conversation.deletedByIds.includes(email.recipientUserId)
  ) {
    return false;
  }

  if (email.eventType === "TECH_CHAT_UNREAD") {
    if (conversation.participantAId === email.recipientUserId) {
      return conversation.unreadCountA > 0;
    }
    if (conversation.participantBId === email.recipientUserId) {
      return conversation.unreadCountB > 0;
    }
    return false;
  }

  const notification = await db.notification.findUnique({
    where: {
      userId_entityType_entityId_eventType: {
        userId: email.recipientUserId,
        entityType: "CONVERSATION",
        entityId: email.entityId,
        eventType: "CHAT_STARTED",
      },
    },
    select: { readAt: true },
  });
  return Boolean(notification && !notification.readAt);
}
