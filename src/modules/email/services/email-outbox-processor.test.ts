import {
  EmailDeliveryAttemptOutcome,
  EmailOutboxStatus,
  type EmailDeliveryAttempt,
  type EmailOutbox,
} from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  sendEmail: vi.fn(),
  renderTemplate: vi.fn(),
  notifyAttention: vi.fn(),
  recoverStale: vi.fn(),
  listDue: vi.fn(),
  claim: vi.fn(),
  markSent: vi.fn(),
  markFailed: vi.fn(),
  markAttention: vi.fn(),
  markCanceled: vi.fn(),
  shouldDeliver: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/modules/email/email-client", () => ({
  sendEmail: mocks.sendEmail,
}));
vi.mock("@/modules/email/templates/email-template-registry", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/email/templates/email-template-registry")
  >("@/modules/email/templates/email-template-registry");
  return {
    ...actual,
    renderTransactionalEmailTemplate: mocks.renderTemplate,
  };
});
vi.mock("./email-outbox-attention-service", () => ({
  notifyAdminsAboutEmailOutboxAttention: mocks.notifyAttention,
}));
vi.mock("./email-outbox-service", () => ({
  recoverStaleEmailOutboxClaims: mocks.recoverStale,
  listDueEmailOutboxIds: mocks.listDue,
  claimEmailOutbox: mocks.claim,
  markEmailOutboxAttemptSent: mocks.markSent,
  markEmailOutboxAttemptFailed: mocks.markFailed,
  markEmailOutboxAttemptRequiresAttention: mocks.markAttention,
  markEmailOutboxAttemptCanceled: mocks.markCanceled,
}));
vi.mock("./tech-email-service", () => ({
  shouldDeliverTechEmailOutbox: mocks.shouldDeliver,
}));

import {
  calculateEmailRetryAt,
  processEmailOutbox,
} from "./email-outbox-processor";

const now = new Date("2026-08-20T15:00:00.000Z");

function makeEmail(overrides: Partial<EmailOutbox> = {}): EmailOutbox {
  return {
    id: "email_1",
    idempotencyKey: "SYSTEM_SMOKE_TEST:admin_1",
    eventType: "SYSTEM_SMOKE_TEST",
    templateKey: "system.smoke-test",
    templateVersion: 1,
    recipientUserId: "admin_1",
    recipientEmail: "admin@example.com",
    recipientName: "Administrador",
    entityType: "USER",
    entityId: "admin_1",
    payload: { message: "Fila operacional." },
    priority: 100,
    status: EmailOutboxStatus.PROCESSING,
    attemptCount: 1,
    maxAttempts: 5,
    nextAttemptAt: now,
    processingStartedAt: now,
    providerMessageId: null,
    lastProviderStatusCode: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    requiresAttentionAt: null,
    canceledAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeAttempt(
  overrides: Partial<EmailDeliveryAttempt> = {},
): EmailDeliveryAttempt {
  return {
    id: "attempt_1",
    emailOutboxId: "email_1",
    attemptNumber: 1,
    outcome: EmailDeliveryAttemptOutcome.PROCESSING,
    providerMessageId: null,
    providerStatusCode: null,
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    ...overrides,
  };
}

function claimed(email = makeEmail()) {
  return {
    status: "CLAIMED" as const,
    outbox: email,
    attempt: makeAttempt({
      emailOutboxId: email.id,
      attemptNumber: email.attemptCount,
    }),
  };
}

describe("email outbox processor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({}));
    mocks.recoverStale.mockResolvedValue({
      inspected: 0,
      recovered: 0,
      requiresAttention: 0,
      requiresAttentionEntries: [],
    });
    mocks.listDue.mockResolvedValue(["email_1"]);
    mocks.claim.mockResolvedValue(claimed());
    mocks.renderTemplate.mockReturnValue({
      subject: "Teste",
      text: "Fila operacional.",
      html: "<p>Fila operacional.</p>",
    });
    mocks.sendEmail.mockResolvedValue({ success: true, id: "resend_1" });
    mocks.markSent.mockResolvedValue(true);
    mocks.markFailed.mockResolvedValue(true);
    mocks.markAttention.mockResolvedValue(true);
    mocks.markCanceled.mockResolvedValue(true);
    mocks.shouldDeliver.mockResolvedValue(true);
    mocks.notifyAttention.mockResolvedValue({ recipientCount: 1, failed: 0 });
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("envia com idempotencia e registra o identificador do Resend", async () => {
    const metrics = await processEmailOutbox({ now });

    expect(metrics).toEqual(
      expect.objectContaining({
        inspected: 1,
        claimed: 1,
        sent: 1,
        retryScheduled: 0,
        requiresAttention: 0,
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        idempotencyKey: "SYSTEM_SMOKE_TEST:admin_1",
      }),
    );
    expect(mocks.markSent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outboxId: "email_1",
        attemptNumber: 1,
        providerMessageId: "resend_1",
      }),
    );
  });

  it("cancela aviso condicionado quando a conversa ja foi lida", async () => {
    mocks.shouldDeliver.mockResolvedValue(false);

    const metrics = await processEmailOutbox({ now });

    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.markCanceled).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ outboxId: "email_1", attemptNumber: 1 }),
    );
    expect(metrics).toEqual(
      expect.objectContaining({ claimed: 1, sent: 0, skipped: 1 }),
    );
  });

  it("agenda backoff progressivo para falha temporaria", async () => {
    mocks.sendEmail.mockResolvedValue({
      success: false,
      error: "Erro ao enviar e-mail.",
      errorCode: "rate_limit_exceeded",
      errorCategory: "RATE_LIMIT",
      statusCode: 429,
      retryable: true,
      detail: "Limite temporario do provedor.",
    });

    const metrics = await processEmailOutbox({ now });

    expect(metrics.retryScheduled).toBe(1);
    expect(mocks.markFailed).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        errorCode: "rate_limit_exceeded",
        nextAttemptAt: new Date("2026-08-20T15:05:00.000Z"),
      }),
    );
    expect(mocks.notifyAttention).not.toHaveBeenCalled();
  });

  it("envia erro permanente diretamente para atencao administrativa", async () => {
    mocks.sendEmail.mockResolvedValue({
      success: false,
      error: "Erro ao enviar e-mail.",
      errorCode: "invalid_from_address",
      errorCategory: "VALIDATION",
      statusCode: 422,
      retryable: false,
      detail: "Remetente invalido.",
    });

    const metrics = await processEmailOutbox({ now });

    expect(metrics.requiresAttention).toBe(1);
    expect(mocks.markAttention).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorCode: "invalid_from_address" }),
    );
    expect(mocks.markFailed).not.toHaveBeenCalled();
    expect(mocks.notifyAttention).toHaveBeenCalledOnce();
  });

  it("nao chama o provedor quando o template falha", async () => {
    const { EmailTemplateNotFoundError } = await import(
      "@/modules/email/templates/email-template-registry"
    );
    mocks.renderTemplate.mockImplementation(() => {
      throw new EmailTemplateNotFoundError("unknown", 1);
    });

    const metrics = await processEmailOutbox({ now });

    expect(metrics.requiresAttention).toBe(1);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.markAttention).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorCode: "EMAIL_TEMPLATE_NOT_FOUND" }),
    );
  });

  it("contabiliza disputa de claim sem duplicar envio", async () => {
    mocks.claim.mockResolvedValue({ status: "BUSY" });

    const metrics = await processEmailOutbox({ now });

    expect(metrics).toEqual(
      expect.objectContaining({ claimed: 0, sent: 0, skipped: 1 }),
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("notifica quando a recuperacao encontra lease esgotado", async () => {
    mocks.recoverStale.mockResolvedValue({
      inspected: 1,
      recovered: 0,
      requiresAttention: 1,
      requiresAttentionEntries: [
        { id: "email_stale", eventType: "WELCOME_EMAIL" },
      ],
    });
    mocks.listDue.mockResolvedValue([]);

    const metrics = await processEmailOutbox({ now });

    expect(metrics.staleRequiresAttention).toBe(1);
    expect(metrics.requiresAttention).toBe(1);
    expect(mocks.notifyAttention).toHaveBeenCalledWith({
      id: "email_stale",
      eventType: "WELCOME_EMAIL",
    });
  });

  it("preserva o lease quando o Resend aceita mas a gravacao local falha", async () => {
    mocks.markSent.mockRejectedValue(new Error("Database unavailable"));

    const metrics = await processEmailOutbox({ now });

    expect(metrics.infrastructureErrors).toBe(1);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "SYSTEM_SMOKE_TEST:admin_1",
      }),
    );
    expect(mocks.markFailed).not.toHaveBeenCalled();
    expect(mocks.markAttention).not.toHaveBeenCalled();
  });

  it("notifica administradores quando a ultima tentativa temporaria falha", async () => {
    mocks.claim.mockResolvedValue(
      claimed(makeEmail({ attemptCount: 5, maxAttempts: 5 })),
    );
    mocks.sendEmail.mockResolvedValue({
      success: false,
      error: "Erro ao enviar e-mail.",
      errorCode: "internal_server_error",
      errorCategory: "PROVIDER",
      statusCode: 503,
      retryable: true,
      detail: "Provedor indisponivel.",
    });

    const metrics = await processEmailOutbox({ now });

    expect(metrics.requiresAttention).toBe(1);
    expect(mocks.markFailed).toHaveBeenCalledOnce();
    expect(mocks.notifyAttention).toHaveBeenCalledOnce();
  });

  it("limita a concorrencia de chamadas ao provedor", async () => {
    vi.useRealTimers();
    mocks.listDue.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => `email_${index + 1}`),
    );
    mocks.claim.mockImplementation(async (_client, id: string) => {
      const attemptNumber = 1;
      return claimed(
        makeEmail({ id, idempotencyKey: `SYSTEM_SMOKE_TEST:${id}`, attemptCount: attemptNumber }),
      );
    });
    let active = 0;
    let maximumActive = 0;
    let deliveryCount = 0;
    mocks.sendEmail.mockImplementation(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      deliveryCount += 1;
      return { success: true, id: `resend_${deliveryCount}` };
    });

    const metrics = await processEmailOutbox({ concurrency: 2 });

    expect(metrics.sent).toBe(6);
    expect(maximumActive).toBe(2);
  });

  it("calcula os intervalos de retry sem ultrapassar o teto", () => {
    expect(calculateEmailRetryAt(1, now)).toEqual(
      new Date("2026-08-20T15:05:00.000Z"),
    );
    expect(calculateEmailRetryAt(2, now)).toEqual(
      new Date("2026-08-20T15:15:00.000Z"),
    );
    expect(calculateEmailRetryAt(3, now)).toEqual(
      new Date("2026-08-20T16:00:00.000Z"),
    );
    expect(calculateEmailRetryAt(9, now)).toEqual(
      new Date("2026-08-20T21:00:00.000Z"),
    );
  });
});
