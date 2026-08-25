import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminRole: vi.fn(),
  rateLimit: vi.fn(),
  transaction: vi.fn(),
  userFind: vi.fn(),
  enqueue: vi.fn(),
  audit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/get-session", () => ({
  requireAdminRole: mocks.requireAdminRole,
}));
vi.mock("@/lib/action-rate-limit", () => ({
  consumeRateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/prisma", () => ({
  db: { $transaction: mocks.transaction },
}));
vi.mock("@/modules/email/services/email-outbox-service", () => ({
  enqueueTransactionalEmail: mocks.enqueue,
}));
vi.mock("./audit-log", () => ({ createAdminAuditLog: mocks.audit }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { queueEmailSmokeTestAdmin } from "./queue-email-smoke-test";

describe("controlled email smoke test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({
      id: "admin_1",
      adminRole: "OWNER",
    });
    mocks.rateLimit.mockResolvedValue(null);
    mocks.userFind.mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      displayName: null,
    });
    mocks.enqueue.mockResolvedValue({
      email: { id: "outbox_1" },
      created: true,
    });
    mocks.audit.mockResolvedValue({ id: "audit_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        user: { findUnique: mocks.userFind },
        emailOutbox: {},
        emailDeliveryAttempt: {},
        $executeRaw: vi.fn(),
      }),
    );
  });

  it("enfileira para o proprio owner e registra auditoria", async () => {
    await expect(queueEmailSmokeTestAdmin()).rejects.toThrow(
      "REDIRECT:/dashboard/admin/emails/outbox_1?result=smoke-queued",
    );

    expect(mocks.enqueue).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipientUserId: "admin_1",
        recipientEmail: "admin@example.com",
        eventType: "SYSTEM_EMAIL_SMOKE_TEST",
      }),
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "EMAIL_OUTBOX_SMOKE_TEST_QUEUED",
        entityId: "outbox_1",
      }),
    );
  });
});
