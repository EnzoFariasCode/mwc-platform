import { EmailOutboxStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  conversationFindUnique: vi.fn(),
  notificationFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    conversation: { findUnique: mocks.conversationFindUnique },
    notification: { findUnique: mocks.notificationFindUnique },
  },
}));

import type { EmailOutboxDatabaseClient } from "./email-outbox-service";
import {
  cancelPendingTechChatEmails,
  enqueueTechChatUnreadEmail,
  shouldDeliverTechEmailOutbox,
  TECH_CHAT_EMAIL_DELAY_MS,
} from "./tech-email-service";

function makeClient() {
  return {
    emailOutbox: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => ({ id: "email_1", ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    emailDeliveryAttempt: {},
  } as unknown as EmailOutboxDatabaseClient;
}

describe("tech email service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrupa o chat pela primeira mensagem nao lida e aplica atraso", async () => {
    const client = makeClient();
    const firstUnreadAt = new Date("2026-08-25T12:00:00.000Z");

    await enqueueTechChatUnreadEmail(client, {
      conversationId: "conversation_1",
      firstUnreadMessageId: "message_1",
      firstUnreadAt,
      recipient: {
        id: "recipient_1",
        email: "recipient@example.com",
        name: "Cliente",
      },
      senderId: "sender_1",
      senderName: "Profissional",
    });

    expect(client.emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey:
          "TECH_CHAT_UNREAD:conversation_1:recipient_1:message_1",
        eventType: "TECH_CHAT_UNREAD",
        templateKey: "tech.chat.unread",
        nextAttemptAt: new Date(
          firstUnreadAt.getTime() + TECH_CHAT_EMAIL_DELAY_MS,
        ),
        payload: expect.objectContaining({
          actionPath: "/dashboard/chat?newChat=sender_1",
        }),
      }),
    });
  });

  it("cancela avisos ainda pendentes quando a conversa e aberta", async () => {
    const client = makeClient();
    await cancelPendingTechChatEmails(client, {
      conversationId: "conversation_1",
      recipientUserId: "recipient_1",
    });

    expect(client.emailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientUserId: "recipient_1",
          entityId: "conversation_1",
          status: {
            in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED],
          },
        }),
        data: expect.objectContaining({ status: EmailOutboxStatus.CANCELED }),
      }),
    );
  });

  it("autoriza aviso somente enquanto houver mensagens nao lidas", async () => {
    mocks.conversationFindUnique.mockResolvedValue({
      participantAId: "recipient_1",
      participantBId: "sender_1",
      unreadCountA: 2,
      unreadCountB: 0,
      deletedByIds: [],
      blocks: [],
    });

    const deliver = await shouldDeliverTechEmailOutbox({
      eventType: "TECH_CHAT_UNREAD",
      entityType: "CONVERSATION",
      entityId: "conversation_1",
      recipientUserId: "recipient_1",
    });

    expect(deliver).toBe(true);

    mocks.conversationFindUnique.mockResolvedValue({
      participantAId: "recipient_1",
      participantBId: "sender_1",
      unreadCountA: 0,
      unreadCountB: 0,
      deletedByIds: [],
      blocks: [],
    });
    await expect(
      shouldDeliverTechEmailOutbox({
        eventType: "TECH_CHAT_UNREAD",
        entityType: "CONVERSATION",
        entityId: "conversation_1",
        recipientUserId: "recipient_1",
      }),
    ).resolves.toBe(false);
  });
});
