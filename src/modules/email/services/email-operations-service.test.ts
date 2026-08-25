import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  heartbeatUpsert: vi.fn(),
  heartbeatUpdate: vi.fn(),
  webhookFindMany: vi.fn(),
  webhookDeleteMany: vi.fn(),
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
  },
}));

import {
  cleanupEmailWebhookEventLogs,
  markEmailOutboxCronStarted,
  markEmailOutboxCronSucceeded,
} from "./email-operations-service";

describe("email operations heartbeat and retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.heartbeatUpsert.mockResolvedValue({});
    mocks.heartbeatUpdate.mockResolvedValue({});
    mocks.webhookFindMany.mockResolvedValue([]);
    mocks.webhookDeleteMany.mockResolvedValue({ count: 0 });
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
});
