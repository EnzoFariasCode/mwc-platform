import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const upsertNotification = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: { user: { findMany } },
}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification,
}));

import { notifyAdminsAboutEmailOutboxAttention } from "./email-outbox-attention-service";

describe("email outbox attention notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([{ id: "admin_1" }, { id: "admin_2" }]);
    upsertNotification.mockResolvedValue({ id: "notification_1" });
  });

  it("notifica todos os administradores ativos sem expor o destinatario", async () => {
    const result = await notifyAdminsAboutEmailOutboxAttention({
      id: "email_1",
      eventType: "HEALTH_PAYMENT_CONFIRMED",
    });

    expect(result).toEqual({ recipientCount: 2, failed: 0 });
    expect(upsertNotification).toHaveBeenCalledTimes(2);
    expect(upsertNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "EMAIL_OUTBOX_REQUIRES_ATTENTION",
        entityType: "EMAIL_OUTBOX",
        entityId: "email_1",
      }),
    );
    expect(JSON.stringify(upsertNotification.mock.calls)).not.toContain("@");
  });
});
