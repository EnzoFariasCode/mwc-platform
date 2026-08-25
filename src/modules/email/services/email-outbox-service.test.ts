import {
  EmailDeliveryAttemptOutcome,
  EmailOutboxStatus,
  Prisma,
  type EmailDeliveryAttempt,
  type EmailOutbox,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ db: {} }));

import {
  claimEmailOutbox,
  EmailOutboxIdempotencyConflictError,
  EmailOutboxValidationError,
  enqueueTransactionalEmail,
  markEmailOutboxAttemptCanceled,
  markEmailOutboxAttemptFailed,
  markEmailOutboxAttemptRequiresAttention,
  listDueEmailOutboxIds,
  normalizeEmailOutboxPayload,
  recoverStaleEmailOutboxClaims,
  type EmailOutboxDatabaseClient,
} from "./email-outbox-service";

const now = new Date("2026-08-20T12:00:00.000Z");

function makeEmail(overrides: Partial<EmailOutbox> = {}): EmailOutbox {
  return {
    id: "email_1",
    idempotencyKey: "WELCOME_EMAIL:user_1",
    eventType: "WELCOME_EMAIL",
    templateKey: "auth.welcome",
    templateVersion: 1,
    recipientUserId: "user_1",
    recipientEmail: "cliente@example.com",
    recipientName: "Cliente",
    entityType: "USER",
    entityId: "user_1",
    payload: { industry: "TECH" },
    priority: 100,
    status: EmailOutboxStatus.PENDING,
    attemptCount: 0,
    maxAttempts: 5,
    nextAttemptAt: new Date("2026-08-20T11:00:00.000Z"),
    processingStartedAt: null,
    providerMessageId: null,
    lastProviderStatusCode: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    requiresAttentionAt: null,
    canceledAt: null,
    retryOfId: null,
    createdAt: new Date("2026-08-20T10:00:00.000Z"),
    updatedAt: new Date("2026-08-20T10:00:00.000Z"),
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

function makeClient() {
  return {
    emailOutbox: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    emailDeliveryAttempt: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  } as unknown as EmailOutboxDatabaseClient;
}

const input = {
  idempotencyKey: "WELCOME_EMAIL:user_1",
  eventType: "WELCOME_EMAIL",
  templateKey: "auth.welcome",
  recipientUserId: "user_1",
  recipientEmail: " Cliente@Example.com ",
  recipientName: " Cliente ",
  entityType: "USER",
  entityId: "user_1",
  payload: { industry: "TECH" },
};

describe("email outbox", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normaliza e persiste um e-mail pendente", async () => {
    const client = makeClient();
    const stored = makeEmail();
    vi.mocked(client.emailOutbox.findUnique).mockResolvedValue(null);
    vi.mocked(client.emailOutbox.create).mockResolvedValue(stored);

    const result = await enqueueTransactionalEmail(client, input);

    expect(result).toEqual({ email: stored, created: true });
    expect(client.emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientEmail: "cliente@example.com",
        recipientName: "Cliente",
        templateVersion: 1,
        maxAttempts: 5,
        priority: 100,
        payload: { industry: "TECH" },
      }),
    });
  });

  it("devolve o registro existente ao repetir a mesma chave", async () => {
    const client = makeClient();
    const stored = makeEmail();
    vi.mocked(client.emailOutbox.findUnique).mockResolvedValue(stored);

    const result = await enqueueTransactionalEmail(client, input);

    expect(result).toEqual({ email: stored, created: false });
    expect(client.emailOutbox.create).not.toHaveBeenCalled();
  });

  it("mantem apenas um registro quando duas criacoes concorrem", async () => {
    const client = makeClient();
    const stored = makeEmail();
    let lookupCount = 0;
    let createCount = 0;

    (
      client.emailOutbox.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      lookupCount += 1;
      return lookupCount <= 2 ? null : stored;
    });
    (
      client.emailOutbox.create as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      createCount += 1;
      if (createCount === 1) return stored;
      throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "6.19.1",
      });
    });

    const results = await Promise.all([
      enqueueTransactionalEmail(client, input),
      enqueueTransactionalEmail(client, input),
    ]);

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(results.filter((result) => !result.created)).toHaveLength(1);
  });

  it("rejeita reutilizar a chave para outro destinatario", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.findUnique).mockResolvedValue(makeEmail());

    await expect(
      enqueueTransactionalEmail(client, {
        ...input,
        recipientEmail: "outro@example.com",
      }),
    ).rejects.toBeInstanceOf(EmailOutboxIdempotencyConflictError);
  });

  it("bloqueia segredos e objetos nao serializaveis no payload", () => {
    expect(() =>
      normalizeEmailOutboxPayload({ resetCode: "123456" }),
    ).toThrow(EmailOutboxValidationError);
    expect(() =>
      normalizeEmailOutboxPayload({ invitationToken: "secret" }),
    ).toThrow(EmailOutboxValidationError);
    expect(() => normalizeEmailOutboxPayload({ when: new Date() })).toThrow(
      EmailOutboxValidationError,
    );
  });

  it("cria uma unica tentativa ao conquistar o claim", async () => {
    const client = makeClient();
    const pending = makeEmail();
    const processing = makeEmail({
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: 1,
      processingStartedAt: now,
    });
    const attempt = makeAttempt();
    vi.mocked(client.emailOutbox.findUnique)
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(processing);
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.create).mockResolvedValue(attempt);

    const result = await claimEmailOutbox(client, pending.id, { now });

    expect(result).toEqual({ status: "CLAIMED", outbox: processing, attempt });
    expect(client.emailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: pending.id,
          attemptCount: 0,
          nextAttemptAt: { lte: now },
        }),
        data: expect.objectContaining({
          status: EmailOutboxStatus.PROCESSING,
          attemptCount: { increment: 1 },
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.create).toHaveBeenCalledOnce();
  });

  it("nao cria tentativa quando perde uma corrida de claim", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.findUnique).mockResolvedValue(makeEmail());
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 0 });

    await expect(claimEmailOutbox(client, "email_1", { now })).resolves.toEqual({
      status: "BUSY",
    });
    expect(client.emailDeliveryAttempt.create).not.toHaveBeenCalled();
  });

  it("encerra a tentativa abandonada antes de criar uma nova", async () => {
    const client = makeClient();
    const stale = makeEmail({
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: 1,
      processingStartedAt: new Date("2026-08-20T10:00:00.000Z"),
    });
    const processing = makeEmail({
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: 2,
      processingStartedAt: now,
    });
    const attempt = makeAttempt({ id: "attempt_2", attemptNumber: 2 });
    vi.mocked(client.emailOutbox.findUnique)
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(processing);
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(client.emailDeliveryAttempt.create).mockResolvedValue(attempt);

    const result = await claimEmailOutbox(client, stale.id, { now });

    expect(result).toEqual({ status: "CLAIMED", outbox: processing, attempt });
    expect(client.emailOutbox.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailOutboxStatus.FAILED,
          lastErrorCode: "PROCESSING_LEASE_EXPIRED",
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ attemptNumber: 1 }),
        data: expect.objectContaining({
          outcome: EmailDeliveryAttemptOutcome.FAILED,
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ attemptNumber: 2 }),
    });
  });

  it("recupera claims vencidos e escala os que esgotaram tentativas", async () => {
    const client = makeClient();
    const retryable = makeEmail({
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: 2,
      processingStartedAt: null,
    });
    const exhausted = makeEmail({
      id: "email_2",
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: 5,
      processingStartedAt: new Date("2026-08-20T11:00:00.000Z"),
    });
    vi.mocked(client.emailOutbox.findMany).mockResolvedValue([
      retryable,
      exhausted,
    ]);
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.updateMany).mockResolvedValue({
      count: 1,
    });

    const result = await recoverStaleEmailOutboxClaims(client, {
      now,
      processingLeaseMs: 30 * 60 * 1000,
    });

    expect(result).toEqual({
      inspected: 2,
      recovered: 1,
      requiresAttention: 1,
      requiresAttentionEntries: [
        { id: "email_2", eventType: exhausted.eventType },
      ],
    });
    expect(client.emailOutbox.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ status: EmailOutboxStatus.FAILED }),
      }),
    );
    expect(client.emailOutbox.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailOutboxStatus.REQUIRES_ATTENTION,
          requiresAttentionAt: now,
        }),
      }),
    );
  });

  it("leva uma falha final para atencao sem perder o historico", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.findUnique).mockResolvedValue(
      makeEmail({
        status: EmailOutboxStatus.PROCESSING,
        attemptCount: 5,
        processingStartedAt: now,
      }),
    );
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.updateMany).mockResolvedValue({
      count: 1,
    });

    const result = await markEmailOutboxAttemptFailed(client, {
      outboxId: "email_1",
      attemptNumber: 5,
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: "Falha temporaria do provedor.",
      nextAttemptAt: new Date("2026-08-20T13:00:00.000Z"),
      failedAt: now,
    });

    expect(result).toBe(true);
    expect(client.emailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailOutboxStatus.REQUIRES_ATTENTION,
          requiresAttentionAt: now,
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: EmailDeliveryAttemptOutcome.FAILED,
          errorCode: "PROVIDER_UNAVAILABLE",
        }),
      }),
    );
  });

  it("lista somente os ids vencidos na ordem operacional", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.findMany).mockResolvedValue([
      { id: "email_priority" },
      { id: "email_oldest" },
    ] as never);

    const result = await listDueEmailOutboxIds(client, { now, limit: 25 });

    expect(result).toEqual(["email_priority", "email_oldest"]);
    expect(client.emailOutbox.findMany).toHaveBeenCalledWith({
      where: {
        status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED] },
        nextAttemptAt: { lte: now },
      },
      select: { id: true },
      orderBy: [
        { priority: "asc" },
        { nextAttemptAt: "asc" },
        { createdAt: "asc" },
      ],
      take: 25,
    });
  });

  it("registra atencao imediata para falha permanente", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.updateMany).mockResolvedValue({
      count: 1,
    });

    const result = await markEmailOutboxAttemptRequiresAttention(client, {
      outboxId: "email_1",
      attemptNumber: 1,
      errorCode: "EMAIL_TEMPLATE_NOT_FOUND",
      errorMessage: "Template nao registrado.",
      failedAt: now,
    });

    expect(result).toBe(true);
    expect(client.emailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailOutboxStatus.REQUIRES_ATTENTION,
          requiresAttentionAt: now,
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: EmailDeliveryAttemptOutcome.FAILED,
          errorCode: "EMAIL_TEMPLATE_NOT_FOUND",
        }),
      }),
    );
  });

  it("cancela claim sem registrar uma tentativa como falha", async () => {
    const client = makeClient();
    vi.mocked(client.emailOutbox.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(client.emailDeliveryAttempt.updateMany).mockResolvedValue({
      count: 1,
    });

    const result = await markEmailOutboxAttemptCanceled(client, {
      outboxId: "email_1",
      attemptNumber: 1,
      canceledAt: now,
    });

    expect(result).toBe(true);
    expect(client.emailOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailOutboxStatus.CANCELED,
          canceledAt: now,
        }),
      }),
    );
    expect(client.emailDeliveryAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: EmailDeliveryAttemptOutcome.CANCELED,
          finishedAt: now,
        }),
      }),
    );
  });
});
