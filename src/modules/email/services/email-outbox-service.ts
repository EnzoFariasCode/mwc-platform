import "server-only";

import {
  EmailDeliveryAttemptOutcome,
  EmailOutboxStatus,
  Prisma,
  type EmailDeliveryAttempt,
  type EmailOutbox,
} from "@prisma/client";

import { db } from "@/lib/prisma";
import { scheduleEmailOutboxDispatch } from "./email-outbox-dispatch";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_PRIORITY = 100;
const DEFAULT_PROCESSING_LEASE_MS = 10 * 60 * 1000;
const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_ERROR_MESSAGE_LENGTH = 4_000;

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "apikey",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "password",
  "passwordhash",
  "passwordresetcode",
  "resetcode",
  "secret",
  "senha",
  "token",
  "verificationcode",
  "otp",
  "cvv",
  "cardnumber",
  "code",
  "codigo",
  "documentbytes",
  "filebytes",
  "recoverycode",
]);

export type EmailOutboxDatabaseClient = Pick<
  Prisma.TransactionClient,
  "emailOutbox" | "emailDeliveryAttempt"
>;

export type EnqueueTransactionalEmailInput = {
  idempotencyKey: string;
  eventType: string;
  templateKey: string;
  templateVersion?: number;
  recipientUserId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  nextAttemptAt?: Date;
};

export type EmailOutboxClaimResult =
  | {
      status: "CLAIMED";
      outbox: EmailOutbox;
      attempt: EmailDeliveryAttempt;
    }
  | {
      status:
        | "NOT_FOUND"
        | "NOT_DUE"
        | "BUSY"
        | "FINALIZED";
    }
  | {
      status: "REQUIRES_ATTENTION";
      outbox: Pick<EmailOutbox, "id" | "eventType">;
    };

type ClaimEmailOutboxOptions = {
  now?: Date;
  processingLeaseMs?: number;
};

type RecoverStaleEmailOutboxOptions = ClaimEmailOutboxOptions & {
  limit?: number;
};

export class EmailOutboxValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailOutboxValidationError";
  }
}

export class EmailOutboxIdempotencyConflictError extends Error {
  constructor(idempotencyKey: string) {
    super(
      `A chave de idempotencia "${idempotencyKey}" ja pertence a outro e-mail.`,
    );
    this.name = "EmailOutboxIdempotencyConflictError";
  }
}

function assertString(
  value: unknown,
  field: string,
  maxLength: number,
  options?: { optional?: false },
): string;
function assertString(
  value: unknown,
  field: string,
  maxLength: number,
  options: { optional: true },
): string | null;
function assertString(
  value: unknown,
  field: string,
  maxLength: number,
  { optional = false }: { optional?: boolean } = {},
) {
  if (value === null || value === undefined) {
    if (optional) return null;
    throw new EmailOutboxValidationError(`${field} e obrigatorio.`);
  }

  if (typeof value !== "string") {
    throw new EmailOutboxValidationError(`${field} deve ser texto.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    if (optional) return null;
    throw new EmailOutboxValidationError(`${field} e obrigatorio.`);
  }

  if (normalized.length > maxLength) {
    throw new EmailOutboxValidationError(
      `${field} excede o limite de ${maxLength} caracteres.`,
    );
  }

  return normalized;
}

function assertInteger(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new EmailOutboxValidationError(
      `${field} deve ser um inteiro entre ${minimum} e ${maximum}.`,
    );
  }
  return value;
}

function normalizePayloadKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function isForbiddenPayloadKey(key: string) {
  const normalized = normalizePayloadKey(key);
  return (
    FORBIDDEN_PAYLOAD_KEYS.has(normalized) ||
    normalized.endsWith("password") ||
    normalized.endsWith("secret") ||
    normalized.endsWith("token")
  );
}

type CanonicalJsonValue =
  | string
  | number
  | boolean
  | null
  | CanonicalJsonObject
  | CanonicalJsonValue[];
interface CanonicalJsonObject {
  [key: string]: CanonicalJsonValue;
}

function canonicalizeJsonValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
): CanonicalJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new EmailOutboxValidationError(
        `Payload contem numero invalido em ${path}.`,
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new EmailOutboxValidationError("Payload contem referencia circular.");
    }
    seen.add(value);
    const result = value.map((item, index) =>
      canonicalizeJsonValue(item, `${path}[${index}]`, seen),
    );
    seen.delete(value);
    return result;
  }

  if (typeof value !== "object" || value === null) {
    throw new EmailOutboxValidationError(
      `Payload contem valor nao serializavel em ${path}.`,
    );
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new EmailOutboxValidationError(
      `Payload contem objeto nao suportado em ${path}.`,
    );
  }

  if (seen.has(value)) {
    throw new EmailOutboxValidationError("Payload contem referencia circular.");
  }
  seen.add(value);

  const result: CanonicalJsonObject = {};
  for (const key of Object.keys(value).sort()) {
    if (
      key === "__proto__" ||
      key === "constructor" ||
      key === "prototype" ||
      isForbiddenPayloadKey(key)
    ) {
      throw new EmailOutboxValidationError(
        `Payload contem o campo sensivel ou inseguro "${key}".`,
      );
    }

    const item = (value as Record<string, unknown>)[key];
    if (item === undefined) {
      throw new EmailOutboxValidationError(
        `Payload contem valor indefinido em ${path}.${key}.`,
      );
    }
    result[key] = canonicalizeJsonValue(item, `${path}.${key}`, seen);
  }

  seen.delete(value);
  return result;
}

export function normalizeEmailOutboxPayload(
  payload: Record<string, unknown> = {},
) {
  const normalized = canonicalizeJsonValue(payload, "payload", new WeakSet());
  const serialized = JSON.stringify(normalized);

  if (Buffer.byteLength(serialized, "utf8") > MAX_PAYLOAD_BYTES) {
    throw new EmailOutboxValidationError(
      `Payload excede o limite de ${MAX_PAYLOAD_BYTES} bytes.`,
    );
  }

  return normalized as Prisma.InputJsonObject;
}

function normalizeEmailAddress(value: string) {
  const email = assertString(value, "recipientEmail", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new EmailOutboxValidationError("recipientEmail e invalido.");
  }
  return email;
}

function normalizeEnqueueInput(input: EnqueueTransactionalEmailInput) {
  const entityType = assertString(input.entityType, "entityType", 100, {
    optional: true,
  });
  const entityId = assertString(input.entityId, "entityId", 191, {
    optional: true,
  });

  if (Boolean(entityType) !== Boolean(entityId)) {
    throw new EmailOutboxValidationError(
      "entityType e entityId devem ser informados em conjunto.",
    );
  }

  const eventType = assertString(input.eventType, "eventType", 100);
  if (!/^[A-Z][A-Z0-9_.:-]*$/.test(eventType)) {
    throw new EmailOutboxValidationError(
      "eventType deve usar letras maiusculas, numeros, ponto, dois-pontos, hifen ou sublinhado.",
    );
  }

  const templateKey = assertString(input.templateKey, "templateKey", 100);
  if (!/^[a-zA-Z0-9_.:-]+$/.test(templateKey)) {
    throw new EmailOutboxValidationError("templateKey possui formato invalido.");
  }

  const nextAttemptAt = input.nextAttemptAt ?? new Date();
  if (Number.isNaN(nextAttemptAt.getTime())) {
    throw new EmailOutboxValidationError("nextAttemptAt e invalido.");
  }

  return {
    idempotencyKey: assertString(
      input.idempotencyKey,
      "idempotencyKey",
      255,
    ),
    eventType,
    templateKey,
    templateVersion: assertInteger(
      input.templateVersion ?? 1,
      "templateVersion",
      1,
      1_000,
    ),
    recipientUserId: assertString(
      input.recipientUserId,
      "recipientUserId",
      191,
      { optional: true },
    ),
    recipientEmail: normalizeEmailAddress(input.recipientEmail),
    recipientName: assertString(input.recipientName, "recipientName", 160, {
      optional: true,
    }),
    entityType,
    entityId,
    payload: normalizeEmailOutboxPayload(input.payload),
    priority: assertInteger(
      input.priority ?? DEFAULT_PRIORITY,
      "priority",
      0,
      1_000,
    ),
    maxAttempts: assertInteger(
      input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      "maxAttempts",
      1,
      20,
    ),
    nextAttemptAt,
  } satisfies Prisma.EmailOutboxUncheckedCreateInput;
}

function canonicalJson(value: Prisma.JsonValue | Prisma.InputJsonValue) {
  return JSON.stringify(
    canonicalizeJsonValue(value, "payload", new WeakSet()),
  );
}

function assertSameIdempotentEmail(
  existing: EmailOutbox,
  requested: ReturnType<typeof normalizeEnqueueInput>,
) {
  if (existing.redactedAt) {
    const belongsToSameOperation =
      existing.eventType === requested.eventType &&
      existing.templateKey === requested.templateKey &&
      existing.templateVersion === requested.templateVersion &&
      existing.entityType === requested.entityType &&
      existing.entityId === requested.entityId;

    if (!belongsToSameOperation) {
      throw new EmailOutboxIdempotencyConflictError(requested.idempotencyKey);
    }
    return;
  }

  const isSameEmail =
    existing.eventType === requested.eventType &&
    existing.templateKey === requested.templateKey &&
    existing.templateVersion === requested.templateVersion &&
    existing.recipientUserId === requested.recipientUserId &&
    existing.recipientEmail === requested.recipientEmail &&
    existing.recipientName === requested.recipientName &&
    existing.entityType === requested.entityType &&
    existing.entityId === requested.entityId &&
    existing.priority === requested.priority &&
    existing.maxAttempts === requested.maxAttempts &&
    canonicalJson(existing.payload) === canonicalJson(requested.payload);

  if (!isSameEmail) {
    throw new EmailOutboxIdempotencyConflictError(requested.idempotencyKey);
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function enqueueTransactionalEmail(
  client: EmailOutboxDatabaseClient,
  input: EnqueueTransactionalEmailInput,
) {
  const data = normalizeEnqueueInput(input);
  const existing = await client.emailOutbox.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });

  if (existing) {
    assertSameIdempotentEmail(existing, data);
    scheduleEmailOutboxDispatch();
    return { email: existing, created: false } as const;
  }

  try {
    const email = await client.emailOutbox.create({ data });
    scheduleEmailOutboxDispatch();
    return { email, created: true } as const;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const concurrent = await client.emailOutbox.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (!concurrent) throw error;

    assertSameIdempotentEmail(concurrent, data);
    scheduleEmailOutboxDispatch();
    return { email: concurrent, created: false } as const;
  }
}

export function queueTransactionalEmail(input: EnqueueTransactionalEmailInput) {
  return enqueueTransactionalEmail(db, input);
}

export async function listDueEmailOutboxIds(
  client: EmailOutboxDatabaseClient,
  options: { now?: Date; limit?: number } = {},
) {
  const now = options.now ?? new Date();
  if (Number.isNaN(now.getTime())) {
    throw new EmailOutboxValidationError("Data de busca da outbox invalida.");
  }
  const limit = assertInteger(options.limit ?? 25, "limit", 1, 100);
  const entries = await client.emailOutbox.findMany({
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
    take: limit,
  });

  return entries.map((entry) => entry.id);
}

function isFinalStatus(status: EmailOutboxStatus) {
  const finalStatuses: ReadonlySet<EmailOutboxStatus> = new Set([
    EmailOutboxStatus.SENT,
    EmailOutboxStatus.DELIVERED,
    EmailOutboxStatus.REQUIRES_ATTENTION,
    EmailOutboxStatus.CANCELED,
  ]);
  return finalStatuses.has(status);
}

export async function claimEmailOutbox(
  client: EmailOutboxDatabaseClient,
  outboxId: string,
  options: ClaimEmailOutboxOptions = {},
): Promise<EmailOutboxClaimResult> {
  const now = options.now ?? new Date();
  const leaseMs = options.processingLeaseMs ?? DEFAULT_PROCESSING_LEASE_MS;
  if (Number.isNaN(now.getTime()) || !Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new EmailOutboxValidationError("Parametros de claim invalidos.");
  }
  const staleBefore = new Date(now.getTime() - leaseMs);
  let current = await client.emailOutbox.findUnique({ where: { id: outboxId } });

  if (!current) return { status: "NOT_FOUND" };
  if (isFinalStatus(current.status)) return { status: "FINALIZED" };

  if (
    current.status === EmailOutboxStatus.PROCESSING &&
    current.processingStartedAt &&
    current.processingStartedAt.getTime() > staleBefore.getTime()
  ) {
    return { status: "BUSY" };
  }

  if (current.attemptCount >= current.maxAttempts) {
    const exhausted = await client.emailOutbox.updateMany({
      where: {
        id: current.id,
        attemptCount: current.attemptCount,
        OR: [
          {
            status: {
              in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED],
            },
          },
          {
            status: EmailOutboxStatus.PROCESSING,
            OR: [
              { processingStartedAt: null },
              { processingStartedAt: { lte: staleBefore } },
            ],
          },
        ],
      },
      data: {
        status: EmailOutboxStatus.REQUIRES_ATTENTION,
        requiresAttentionAt: now,
        processingStartedAt: null,
        ...(current.status === EmailOutboxStatus.PROCESSING
          ? {
              failedAt: now,
              lastErrorCode: "PROCESSING_LEASE_EXPIRED",
              lastErrorMessage:
                "O processamento anterior perdeu a concessao e esgotou o limite de tentativas.",
            }
          : {}),
      },
    });

    if (
      exhausted.count === 1 &&
      current.status === EmailOutboxStatus.PROCESSING
    ) {
      await client.emailDeliveryAttempt.updateMany({
        where: {
          emailOutboxId: current.id,
          attemptNumber: current.attemptCount,
          outcome: EmailDeliveryAttemptOutcome.PROCESSING,
        },
        data: {
          outcome: EmailDeliveryAttemptOutcome.FAILED,
          errorCode: "PROCESSING_LEASE_EXPIRED",
          errorMessage:
            "O processamento anterior perdeu a concessao e esgotou o limite de tentativas.",
          finishedAt: now,
        },
      });
    }
    return {
      status: "REQUIRES_ATTENTION",
      outbox: { id: current.id, eventType: current.eventType },
    };
  }

  if (current.status === EmailOutboxStatus.PROCESSING) {
    const recovered = await client.emailOutbox.updateMany({
      where: {
        id: current.id,
        status: EmailOutboxStatus.PROCESSING,
        attemptCount: current.attemptCount,
        OR: [
          { processingStartedAt: null },
          { processingStartedAt: { lte: staleBefore } },
        ],
      },
      data: {
        status: EmailOutboxStatus.FAILED,
        nextAttemptAt: now,
        processingStartedAt: null,
        lastErrorCode: "PROCESSING_LEASE_EXPIRED",
        lastErrorMessage:
          "O processamento anterior perdeu a concessao antes de registrar o resultado.",
        failedAt: now,
      },
    });

    if (recovered.count !== 1) return { status: "BUSY" };

    await client.emailDeliveryAttempt.updateMany({
      where: {
        emailOutboxId: current.id,
        attemptNumber: current.attemptCount,
        outcome: EmailDeliveryAttemptOutcome.PROCESSING,
      },
      data: {
        outcome: EmailDeliveryAttemptOutcome.FAILED,
        errorCode: "PROCESSING_LEASE_EXPIRED",
        errorMessage:
          "O processamento anterior perdeu a concessao antes de registrar o resultado.",
        finishedAt: now,
      },
    });

    current = {
      ...current,
      status: EmailOutboxStatus.FAILED,
      nextAttemptAt: now,
      processingStartedAt: null,
      lastErrorCode: "PROCESSING_LEASE_EXPIRED",
      lastErrorMessage:
        "O processamento anterior perdeu a concessao antes de registrar o resultado.",
      failedAt: now,
    };
  }

  if (current.nextAttemptAt.getTime() > now.getTime()) {
    return { status: "NOT_DUE" };
  }

  const claimed = await client.emailOutbox.updateMany({
    where: {
      id: current.id,
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED] },
      attemptCount: current.attemptCount,
      nextAttemptAt: { lte: now },
    },
    data: {
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: { increment: 1 },
      processingStartedAt: now,
      lastErrorCode: null,
      lastErrorMessage: null,
      lastProviderStatusCode: null,
      failedAt: null,
    },
  });

  if (claimed.count !== 1) return { status: "BUSY" };

  const outbox = await client.emailOutbox.findUnique({
    where: { id: current.id },
  });
  if (!outbox) return { status: "NOT_FOUND" };

  const attempt = await client.emailDeliveryAttempt.create({
    data: {
      emailOutboxId: outbox.id,
      attemptNumber: outbox.attemptCount,
      outcome: EmailDeliveryAttemptOutcome.PROCESSING,
      startedAt: now,
    },
  });

  return { status: "CLAIMED", outbox, attempt };
}

export async function markEmailOutboxAttemptSent(
  client: EmailOutboxDatabaseClient,
  input: {
    outboxId: string;
    attemptNumber: number;
    providerMessageId: string;
    providerStatusCode?: number | null;
    sentAt?: Date;
  },
) {
  const sentAt = input.sentAt ?? new Date();
  const providerMessageId = assertString(
    input.providerMessageId,
    "providerMessageId",
    191,
  );
  const updated = await client.emailOutbox.updateMany({
    where: {
      id: input.outboxId,
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: input.attemptNumber,
    },
    data: {
      status: EmailOutboxStatus.SENT,
      providerMessageId,
      lastProviderStatusCode: input.providerStatusCode ?? null,
      sentAt,
      processingStartedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      failedAt: null,
    },
  });

  if (updated.count !== 1) return false;

  await client.emailDeliveryAttempt.updateMany({
    where: {
      emailOutboxId: input.outboxId,
      attemptNumber: input.attemptNumber,
      outcome: EmailDeliveryAttemptOutcome.PROCESSING,
    },
    data: {
      outcome: EmailDeliveryAttemptOutcome.SENT,
      providerMessageId,
      providerStatusCode: input.providerStatusCode ?? null,
      finishedAt: sentAt,
    },
  });
  return true;
}

export async function markEmailOutboxAttemptCanceled(
  client: EmailOutboxDatabaseClient,
  input: {
    outboxId: string;
    attemptNumber: number;
    canceledAt?: Date;
  },
) {
  const canceledAt = input.canceledAt ?? new Date();
  const updated = await client.emailOutbox.updateMany({
    where: {
      id: input.outboxId,
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: input.attemptNumber,
    },
    data: {
      status: EmailOutboxStatus.CANCELED,
      processingStartedAt: null,
      canceledAt,
      failedAt: null,
      requiresAttentionAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  if (updated.count !== 1) return false;

  await client.emailDeliveryAttempt.updateMany({
    where: {
      emailOutboxId: input.outboxId,
      attemptNumber: input.attemptNumber,
      outcome: EmailDeliveryAttemptOutcome.PROCESSING,
    },
    data: {
      outcome: EmailDeliveryAttemptOutcome.CANCELED,
      finishedAt: canceledAt,
    },
  });
  return true;
}

export async function markEmailOutboxAttemptFailed(
  client: EmailOutboxDatabaseClient,
  input: {
    outboxId: string;
    attemptNumber: number;
    errorCode: string;
    errorMessage: string;
    providerStatusCode?: number | null;
    nextAttemptAt: Date;
    failedAt?: Date;
  },
) {
  const failedAt = input.failedAt ?? new Date();
  const current = await client.emailOutbox.findUnique({
    where: { id: input.outboxId },
  });
  if (
    !current ||
    current.status !== EmailOutboxStatus.PROCESSING ||
    current.attemptCount !== input.attemptNumber
  ) {
    return false;
  }

  const requiresAttention = current.attemptCount >= current.maxAttempts;
  const errorCode = assertString(input.errorCode, "errorCode", 100);
  const errorMessage = assertString(
    input.errorMessage,
    "errorMessage",
    MAX_ERROR_MESSAGE_LENGTH,
  );
  const updated = await client.emailOutbox.updateMany({
    where: {
      id: current.id,
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: input.attemptNumber,
    },
    data: {
      status: requiresAttention
        ? EmailOutboxStatus.REQUIRES_ATTENTION
        : EmailOutboxStatus.FAILED,
      nextAttemptAt: input.nextAttemptAt,
      processingStartedAt: null,
      lastProviderStatusCode: input.providerStatusCode ?? null,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
      failedAt,
      requiresAttentionAt: requiresAttention ? failedAt : null,
    },
  });

  if (updated.count !== 1) return false;

  await client.emailDeliveryAttempt.updateMany({
    where: {
      emailOutboxId: input.outboxId,
      attemptNumber: input.attemptNumber,
      outcome: EmailDeliveryAttemptOutcome.PROCESSING,
    },
    data: {
      outcome: EmailDeliveryAttemptOutcome.FAILED,
      providerStatusCode: input.providerStatusCode ?? null,
      errorCode,
      errorMessage,
      finishedAt: failedAt,
    },
  });
  return true;
}

export async function markEmailOutboxAttemptRequiresAttention(
  client: EmailOutboxDatabaseClient,
  input: {
    outboxId: string;
    attemptNumber: number;
    errorCode: string;
    errorMessage: string;
    providerStatusCode?: number | null;
    failedAt?: Date;
  },
) {
  const failedAt = input.failedAt ?? new Date();
  const errorCode = assertString(input.errorCode, "errorCode", 100);
  const errorMessage = assertString(
    input.errorMessage,
    "errorMessage",
    MAX_ERROR_MESSAGE_LENGTH,
  );
  const updated = await client.emailOutbox.updateMany({
    where: {
      id: input.outboxId,
      status: EmailOutboxStatus.PROCESSING,
      attemptCount: input.attemptNumber,
    },
    data: {
      status: EmailOutboxStatus.REQUIRES_ATTENTION,
      processingStartedAt: null,
      lastProviderStatusCode: input.providerStatusCode ?? null,
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
      failedAt,
      requiresAttentionAt: failedAt,
    },
  });

  if (updated.count !== 1) return false;

  await client.emailDeliveryAttempt.updateMany({
    where: {
      emailOutboxId: input.outboxId,
      attemptNumber: input.attemptNumber,
      outcome: EmailDeliveryAttemptOutcome.PROCESSING,
    },
    data: {
      outcome: EmailDeliveryAttemptOutcome.FAILED,
      providerStatusCode: input.providerStatusCode ?? null,
      errorCode,
      errorMessage,
      finishedAt: failedAt,
    },
  });
  return true;
}

export async function recoverStaleEmailOutboxClaims(
  client: EmailOutboxDatabaseClient,
  options: RecoverStaleEmailOutboxOptions = {},
) {
  const now = options.now ?? new Date();
  const leaseMs = options.processingLeaseMs ?? DEFAULT_PROCESSING_LEASE_MS;
  if (Number.isNaN(now.getTime()) || !Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new EmailOutboxValidationError("Parametros de recuperacao invalidos.");
  }
  const staleBefore = new Date(now.getTime() - leaseMs);
  const limit = assertInteger(options.limit ?? 100, "limit", 1, 500);
  const staleEntries = await client.emailOutbox.findMany({
    where: {
      status: EmailOutboxStatus.PROCESSING,
      OR: [
        { processingStartedAt: null },
        { processingStartedAt: { lte: staleBefore } },
      ],
    },
    orderBy: { processingStartedAt: "asc" },
    take: limit,
  });

  let recovered = 0;
  let requiresAttention = 0;
  const requiresAttentionEntries: Array<
    Pick<EmailOutbox, "id" | "eventType">
  > = [];

  for (const entry of staleEntries) {
    const exhausted = entry.attemptCount >= entry.maxAttempts;
    const updated = await client.emailOutbox.updateMany({
      where: {
        id: entry.id,
        status: EmailOutboxStatus.PROCESSING,
        attemptCount: entry.attemptCount,
        OR: [
          { processingStartedAt: null },
          { processingStartedAt: { lte: staleBefore } },
        ],
      },
      data: {
        status: exhausted
          ? EmailOutboxStatus.REQUIRES_ATTENTION
          : EmailOutboxStatus.FAILED,
        nextAttemptAt: now,
        processingStartedAt: null,
        lastErrorCode: "PROCESSING_LEASE_EXPIRED",
        lastErrorMessage:
          "O processamento anterior perdeu a concessao antes de registrar o resultado.",
        failedAt: now,
        requiresAttentionAt: exhausted ? now : null,
      },
    });

    if (updated.count !== 1) continue;

    await client.emailDeliveryAttempt.updateMany({
      where: {
        emailOutboxId: entry.id,
        attemptNumber: entry.attemptCount,
        outcome: EmailDeliveryAttemptOutcome.PROCESSING,
      },
      data: {
        outcome: EmailDeliveryAttemptOutcome.FAILED,
        errorCode: "PROCESSING_LEASE_EXPIRED",
        errorMessage:
          "O processamento anterior perdeu a concessao antes de registrar o resultado.",
        finishedAt: now,
      },
    });

    if (exhausted) {
      requiresAttention += 1;
      requiresAttentionEntries.push({ id: entry.id, eventType: entry.eventType });
    } else recovered += 1;
  }

  return {
    inspected: staleEntries.length,
    recovered,
    requiresAttention,
    requiresAttentionEntries,
  };
}
