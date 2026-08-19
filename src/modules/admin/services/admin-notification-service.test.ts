import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());
const upsertNotificationMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: { user: { findMany: findManyMock } },
}));
vi.mock("@/modules/email/email-client", () => ({
  sendEmail: sendEmailMock,
}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification: upsertNotificationMock,
}));

import { sendAdminNotification } from "./admin-notification-service";

describe("sendAdminNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([
      { id: "owner", email: "owner@example.com", adminRole: "OWNER" },
      { id: "finance", email: "finance@example.com", adminRole: "FINANCE" },
      { id: "support", email: "support@example.com", adminRole: "SUPPORT" },
      { id: "missing-role", email: "invalid@example.com", adminRole: null },
    ]);
    sendEmailMock.mockResolvedValue({ success: true, id: "email-id" });
    upsertNotificationMock.mockResolvedValue({ id: "notification-id" });
  });

  it("delivers only to the requested administrative roles", async () => {
    const result = await sendAdminNotification({
      subject: "Novo saque",
      lines: ["Existe um saque pendente."],
      roles: ["OWNER", "FINANCE"],
    });

    expect(result).toEqual({
      recipientCount: 2,
      deliveredCount: 2,
      failedCount: 0,
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "owner@example.com" }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "finance@example.com" }),
    );
  });

  it("persists an in-app notification when entity data is provided", async () => {
    await sendAdminNotification({
      subject: "Disputa aberta",
      lines: ["Uma disputa precisa de mediacao."],
      roles: ["OWNER", "SUPPORT"],
      actionUrl: "https://example.com/dashboard/admin/disputas/1",
      notification: {
        eventType: "ADMIN_DISPUTE_OPENED",
        entityType: "TECH_PROJECT",
        entityId: "project-1",
      },
    });

    expect(upsertNotificationMock).toHaveBeenCalledTimes(2);
    expect(upsertNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "support",
        entityType: "TECH_PROJECT",
        entityId: "project-1",
      }),
    );
  });

  it("reports provider failures without throwing the business operation", async () => {
    sendEmailMock
      .mockResolvedValueOnce({ success: true, id: "email-id" })
      .mockResolvedValueOnce({ success: false, error: "provider unavailable" });

    await expect(
      sendAdminNotification({
        subject: "Alerta",
        lines: ["Falha operacional."],
        roles: ["OWNER", "FINANCE"],
      }),
    ).resolves.toEqual({
      recipientCount: 2,
      deliveredCount: 1,
      failedCount: 1,
    });
  });
});
