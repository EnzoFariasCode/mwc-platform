import "server-only";

import type { EmailOutbox } from "@prisma/client";

import { db } from "@/lib/prisma";
import { sendEmail, type SendEmailResult } from "@/modules/email/email-client";
import {
  EmailTemplateNotFoundError,
  EmailTemplatePayloadError,
  renderTransactionalEmailTemplate,
} from "@/modules/email/templates/email-template-registry";
import { notifyAdminsAboutEmailOutboxAttention } from "./email-outbox-attention-service";
import {
  claimEmailOutbox,
  listDueEmailOutboxIds,
  markEmailOutboxAttemptFailed,
  markEmailOutboxAttemptRequiresAttention,
  markEmailOutboxAttemptSent,
  recoverStaleEmailOutboxClaims,
} from "./email-outbox-service";

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_CONCURRENCY = 5;
const MAX_BATCH_SIZE = 100;
const MAX_CONCURRENCY = 10;
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
] as const;

type EmailOutboxItemOutcome =
  | "SENT"
  | "RETRY_SCHEDULED"
  | "REQUIRES_ATTENTION"
  | "SKIPPED"
  | "INFRASTRUCTURE_ERROR";

export type EmailOutboxProcessorMetrics = {
  inspected: number;
  claimed: number;
  sent: number;
  retryScheduled: number;
  requiresAttention: number;
  skipped: number;
  infrastructureErrors: number;
  staleInspected: number;
  staleRecovered: number;
  staleRequiresAttention: number;
  durationMs: number;
};

type EmailOutboxProcessorOptions = {
  batchSize?: number;
  concurrency?: number;
  now?: Date;
};

function boundedInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Valor deve ser um inteiro entre 1 e ${maximum}.`);
  }
  return value;
}

export function calculateEmailRetryAt(attemptNumber: number, from: Date) {
  const delay =
    RETRY_DELAYS_MS[Math.min(Math.max(attemptNumber - 1, 0), RETRY_DELAYS_MS.length - 1)];
  return new Date(from.getTime() + delay);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function consume() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => consume()),
  );
  return results;
}

function templateFailure(error: unknown) {
  if (
    error instanceof EmailTemplateNotFoundError ||
    error instanceof EmailTemplatePayloadError
  ) {
    return { code: error.code, message: error.message };
  }
  return {
    code: "EMAIL_TEMPLATE_RENDER_FAILED",
    message: "O template falhou durante a renderizacao.",
  };
}

async function notifyAttentionSafely(
  email: Pick<EmailOutbox, "id" | "eventType">,
) {
  await notifyAdminsAboutEmailOutboxAttention(email).catch((error) => {
    console.error("[EMAIL_OUTBOX_ATTENTION_NOTIFICATION_ERROR]", {
      outboxId: email.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  });
}

async function requireAttention(
  email: EmailOutbox,
  error: {
    code: string;
    message: string;
    statusCode?: number | null;
  },
  failedAt: Date,
) {
  const marked = await db.$transaction((tx) =>
    markEmailOutboxAttemptRequiresAttention(tx, {
      outboxId: email.id,
      attemptNumber: email.attemptCount,
      errorCode: error.code,
      errorMessage: error.message,
      providerStatusCode: error.statusCode,
      failedAt,
    }),
  );

  if (marked) {
    await notifyAttentionSafely(email);
  }
  return marked;
}

async function recordDeliveryFailure(
  email: EmailOutbox,
  result: Exclude<SendEmailResult, { success: true }>,
  failedAt: Date,
) {
  if (!result.retryable) {
    const marked = await requireAttention(
      email,
      {
        code: result.errorCode,
        message: result.detail,
        statusCode: result.statusCode,
      },
      failedAt,
    );
    return marked ? "REQUIRES_ATTENTION" : "SKIPPED";
  }

  const reachedLimit = email.attemptCount >= email.maxAttempts;
  const marked = await db.$transaction((tx) =>
    markEmailOutboxAttemptFailed(tx, {
      outboxId: email.id,
      attemptNumber: email.attemptCount,
      errorCode: result.errorCode,
      errorMessage: result.detail,
      providerStatusCode: result.statusCode,
      nextAttemptAt: calculateEmailRetryAt(email.attemptCount, failedAt),
      failedAt,
    }),
  );

  if (!marked) return "SKIPPED";
  if (reachedLimit) {
    await notifyAttentionSafely(email);
    return "REQUIRES_ATTENTION";
  }
  return "RETRY_SCHEDULED";
}

async function processEmailOutboxItem(
  outboxId: string,
  runAt: Date,
): Promise<{ outcome: EmailOutboxItemOutcome; claimed: boolean }> {
  let claimedEmail: EmailOutbox | null = null;

  try {
    const claim = await db.$transaction((tx) =>
      claimEmailOutbox(tx, outboxId, { now: runAt }),
    );
    if (claim.status !== "CLAIMED") {
      if (claim.status === "REQUIRES_ATTENTION") {
        await notifyAttentionSafely(claim.outbox);
      }
      return {
        outcome:
          claim.status === "REQUIRES_ATTENTION"
            ? "REQUIRES_ATTENTION"
            : "SKIPPED",
        claimed: false,
      };
    }
    claimedEmail = claim.outbox;

    let rendered;
    try {
      rendered = renderTransactionalEmailTemplate({
        templateKey: claim.outbox.templateKey,
        templateVersion: claim.outbox.templateVersion,
        payload: claim.outbox.payload,
      });
    } catch (error) {
      const failure = templateFailure(error);
      const marked = await requireAttention(claim.outbox, failure, new Date());
      return {
        outcome: marked ? "REQUIRES_ATTENTION" : "SKIPPED",
        claimed: true,
      };
    }

    const result = await sendEmail({
      to: claim.outbox.recipientEmail,
      ...rendered,
      idempotencyKey: claim.outbox.idempotencyKey,
      logPrefix: "EMAIL_OUTBOX",
      failWhenMissingConfig: true,
    });
    const finishedAt = new Date();

    if (!result.success) {
      const outcome = await recordDeliveryFailure(
        claim.outbox,
        result,
        finishedAt,
      );
      return { outcome, claimed: true };
    }

    const marked = await db.$transaction((tx) =>
      markEmailOutboxAttemptSent(tx, {
        outboxId: claim.outbox.id,
        attemptNumber: claim.outbox.attemptCount,
        providerMessageId: result.id,
        sentAt: finishedAt,
      }),
    );
    return { outcome: marked ? "SENT" : "SKIPPED", claimed: true };
  } catch (error) {
    console.error("[EMAIL_OUTBOX_ITEM_INFRASTRUCTURE_ERROR]", {
      outboxId,
      claimed: Boolean(claimedEmail),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { outcome: "INFRASTRUCTURE_ERROR", claimed: Boolean(claimedEmail) };
  }
}

export async function processEmailOutbox(
  options: EmailOutboxProcessorOptions = {},
): Promise<EmailOutboxProcessorMetrics> {
  const startedAtMs = Date.now();
  const runAt = options.now ?? new Date();
  if (Number.isNaN(runAt.getTime())) throw new Error("Data de execucao invalida.");
  const batchSize = boundedInteger(options.batchSize, DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE);
  const concurrency = boundedInteger(
    options.concurrency,
    DEFAULT_CONCURRENCY,
    MAX_CONCURRENCY,
  );

  const stale = await db.$transaction((tx) =>
    recoverStaleEmailOutboxClaims(tx, { now: runAt, limit: batchSize }),
  );
  await Promise.all(
    stale.requiresAttentionEntries.map((entry) => notifyAttentionSafely(entry)),
  );
  const ids = await listDueEmailOutboxIds(db, { now: runAt, limit: batchSize });
  const results = await mapWithConcurrency(ids, concurrency, (id) =>
    processEmailOutboxItem(id, runAt),
  );

  const metrics: EmailOutboxProcessorMetrics = {
    inspected: ids.length,
    claimed: results.filter((result) => result.claimed).length,
    sent: results.filter((result) => result.outcome === "SENT").length,
    retryScheduled: results.filter(
      (result) => result.outcome === "RETRY_SCHEDULED",
    ).length,
    requiresAttention:
      stale.requiresAttention +
      results.filter((result) => result.outcome === "REQUIRES_ATTENTION").length,
    skipped: results.filter((result) => result.outcome === "SKIPPED").length,
    infrastructureErrors: results.filter(
      (result) => result.outcome === "INFRASTRUCTURE_ERROR",
    ).length,
    staleInspected: stale.inspected,
    staleRecovered: stale.recovered,
    staleRequiresAttention: stale.requiresAttention,
    durationMs: Date.now() - startedAtMs,
  };

  console.info("[EMAIL_OUTBOX_METRICS]", metrics);
  return metrics;
}
