import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  heartbeatUpsert: vi.fn(),
  heartbeatUpdate: vi.fn(),
  webhookFindMany: vi.fn(),
  webhookDeleteMany: vi.fn(),
  outboxFindMany: vi.fn(),
  outboxUpdateMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    emailOperationsHeartbeat: {
      upsert: mocks.heartbeatUpsert,
      update: mocks.heartbeatUpdate,
    },
    emailWebhookEventLog: {
      findMany: mocks.webhookFindMany,
      deleteMany: mocks.webhookDeleteMany,
    },
    emailOutbox: {
      findMany: mocks.outboxFindMany,
      updateMany: mocks.outboxUpdateMany,
    },
  },
}));

import {
  cleanupEmailWebhookEventLogs,
  markEmailOutboxCronStarted,
  markEmailOutboxCronSucceeded,
  redactExpiredEmailOutboxPersonalData,
} from "./email-operations-service";

describe("email operations heartbeat and retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.heartbeatUpsert.mockResolvedValue({});
    mocks.heartbeatUpdate.mockResolvedValue({});
    mocks.webhookFindMany.mockResolvedValue([]);
    mocks.webhookDeleteMany.mockResolvedValue({ count: 0 });
    mocks.outboxFindMany.mockResolvedValue([]);
    mocks.outboxUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("registra inicio e sucesso sem apagar o historico anterior no inicio", async () => {
    const startedAt = new Date("2026-08-25T12:00:00.000Z");
    const completedAt = new Date("2026-08-25T12:00:02.000Z");

    await markEmailOutboxCronStarted(startedAt);
    await markEmailOutboxCronSucceeded({
      startedAt,
      completedAt,
      metrics: { sent: 1 },
    });

    expect(mocks.heartbeatUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "RUNNING", lastStartedAt: startedAt }),
      }),
    );
    expect(mocks.heartbeatUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCESS",
          lastSucceededAt: completedAt,
          lastDurationMs: 2_000,
        }),
      }),
    );
  });

  it("remove em lotes apenas logs tecnicos terminais expirados", async () => {
    mocks.webhookFindMany.mockResolvedValue([{ id: "event_1" }]);
    mocks.webhookDeleteMany.mockResolvedValue({ count: 1 });

    await expect(
      cleanupEmailWebhookEventLogs(new Date("2026-08-25T12:00:00.000Z")),
    ).resolves.toBe(1);
    expect(mocks.webhookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["PROCESSED", "IGNORED"] },
        }),
        take: 1_000,
      }),
    );
    expect(mocks.webhookDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["event_1"] } },
    });
  });

  it("remove dados pessoais antigos sem apagar a idempotencia da outbox", async () => {
    const now = new Date("2026-08-25T12:00:00.000Z");
    mocks.outboxFindMany.mockResolvedValue([{ id: "email_1" }]);
    mocks.outboxUpdateMany.mockResolvedValue({ count: 1 });

    await expect(redactExpiredEmailOutboxPersonalData(now)).resolves.toBe(1);

    expect(mocks.outboxFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["SENT", "DELIVERED", "CANCELED"] },
          redactedAt: null,
        }),
        take: 500,
      }),
    );
    expect(mocks.outboxUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientUserId: null,
          recipientEmail: "redacted@privacy.invalid",
          recipientName: null,
          payload: { redacted: true },
          redactedAt: now,
        }),
      }),
    );
  });
});
