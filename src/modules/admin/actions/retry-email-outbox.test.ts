import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminRole: vi.fn(),
  rateLimit: vi.fn(),
  transaction: vi.fn(),
  sourceFind: vi.fn(),
  retryCreate: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
}));

vi.mock("@/lib/get-session", () => ({ requireAdminRole: mocks.requireAdminRole }));
vi.mock("@/lib/action-rate-limit", () => ({ consumeRateLimit: mocks.rateLimit }));
vi.mock("@/lib/prisma", () => ({
  db: {
    $transaction: mocks.transaction,
    emailOutbox: { findUnique: vi.fn() },
  },
}));
vi.mock("./audit-log", () => ({ createAdminAuditLog: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { retryEmailOutboxAdmin } from "./retry-email-outbox";

function form() {
  const data = new FormData();
  data.set("outboxId", "outbox_1");
  return data;
}

const source = {
  id: "outbox_1",
  status: "REQUIRES_ATTENTION",
  retry: null,
  attemptCount: 1,
  providerMessageId: "resend_1",
  idempotencyKey: "EVENT:entity:user",
  eventType: "TECH_PROPOSAL_RECEIVED",
  templateKey: "tech.proposal.received",
  templateVersion: 1,
  recipientUserId: "user_1",
  recipientEmail: "user@example.com",
  recipientName: "Pessoa",
  entityType: "PROJECT",
  entityId: "project_1",
  payload: { title: "Evento" },
  priority: 100,
  maxAttempts: 5,
};

describe("administrative email retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ id: "admin_1", adminRole: "OWNER" });
    mocks.rateLimit.mockResolvedValue(null);
    mocks.audit.mockResolvedValue({ id: "audit_1" });
    mocks.sourceFind.mockResolvedValue(source);
    mocks.retryCreate.mockResolvedValue({ id: "outbox_retry_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        emailOutbox: {
          findFirst: mocks.sourceFind,
          create: mocks.retryCreate,
        },
        $executeRaw: vi.fn(),
      }),
    );
  });

  it("cria uma nova outbox com idempotencia propria e auditoria", async () => {
    await expect(retryEmailOutboxAdmin(form())).rejects.toThrow(
      "REDIRECT:/dashboard/admin/emails/outbox_retry_1?result=queued",
    );

    expect(mocks.audit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "EMAIL_OUTBOX_RETRY_QUEUED",
        entityId: "outbox_1",
      }),
    );
    expect(mocks.retryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        retryOfId: "outbox_1",
        idempotencyKey: "ADMIN_EMAIL_RETRY:outbox_1:audit_1",
      }),
    });
  });

  it("reutiliza a tentativa vinculada e nao duplica por clique repetido", async () => {
    mocks.sourceFind.mockResolvedValue({
      ...source,
      retry: { id: "outbox_retry_existing" },
    });

    await expect(retryEmailOutboxAdmin(form())).rejects.toThrow(
      "REDIRECT:/dashboard/admin/emails/outbox_retry_existing?result=already-queued",
    );

    expect(mocks.retryCreate).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("nao cria retry manual enquanto a falha ainda pertence ao fluxo automatico", async () => {
    mocks.sourceFind.mockResolvedValue({ ...source, status: "FAILED" });

    await expect(retryEmailOutboxAdmin(form())).rejects.toThrow(
      "REDIRECT:/dashboard/admin/emails/outbox_1?result=not-retryable",
    );

    expect(mocks.retryCreate).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
