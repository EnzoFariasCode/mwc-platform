import "server-only";

import {
  EmailOutboxStatus,
  EmailWebhookEventStatus,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/prisma";

export const EMAIL_OUTBOX_HEARTBEAT_KEY = "EMAIL_OUTBOX_CRON";
const WEBHOOK_EVENT_RETENTION_DAYS = 180;
const WEBHOOK_EVENT_CLEANUP_LIMIT = 1_000;
const OUTBOX_PERSONAL_DATA_RETENTION_DAYS = 180;
const OUTBOX_REDACTION_LIMIT = 500;
const REDACTED_EMAIL = "redacted@privacy.invalid";

function safeError(error: unknown) {
  return {
    code: error instanceof Error ? error.name.slice(0, 100) : "UnknownError",
    message:
      error instanceof Error
        ? error.message.slice(0, 2_000)
        : "Falha operacional desconhecida.",
  };
}

export async function markEmailOutboxCronStarted(startedAt: Date) {
  await db.emailOperationsHeartbeat.upsert({
    where: { key: EMAIL_OUTBOX_HEARTBEAT_KEY },
    create: {
      key: EMAIL_OUTBOX_HEARTBEAT_KEY,
      status: "RUNNING",
      lastStartedAt: startedAt,
    },
    update: {
      status: "RUNNING",
      lastStartedAt: startedAt,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });
}

export async function markEmailOutboxCronSucceeded(input: {
  startedAt: Date;
  completedAt: Date;
  metrics: Prisma.InputJsonValue;
}) {
  await db.emailOperationsHeartbeat.update({
    where: { key: EMAIL_OUTBOX_HEARTBEAT_KEY },
    data: {
      status: "SUCCESS",
      lastSucceededAt: input.completedAt,
      lastDurationMs: Math.max(
        0,
        input.completedAt.getTime() - input.startedAt.getTime(),
      ),
      lastMetrics: input.metrics,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });
}

export async function markEmailOutboxCronFailed(input: {
  startedAt: Date;
  failedAt: Date;
  error: unknown;
}) {
  const failure = safeError(input.error);
  await db.emailOperationsHeartbeat.upsert({
    where: { key: EMAIL_OUTBOX_HEARTBEAT_KEY },
    create: {
      key: EMAIL_OUTBOX_HEARTBEAT_KEY,
      status: "FAILED",
      lastStartedAt: input.startedAt,
      lastFailedAt: input.failedAt,
      lastDurationMs: Math.max(
        0,
        input.failedAt.getTime() - input.startedAt.getTime(),
      ),
      lastErrorCode: failure.code,
      lastErrorMessage: failure.message,
    },
    update: {
      status: "FAILED",
      lastFailedAt: input.failedAt,
      lastDurationMs: Math.max(
        0,
        input.failedAt.getTime() - input.startedAt.getTime(),
      ),
      lastErrorCode: failure.code,
      lastErrorMessage: failure.message,
    },
  });
}

export async function cleanupEmailWebhookEventLogs(now = new Date()) {
  const cutoff = new Date(
    now.getTime() - WEBHOOK_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
  );
  const expired = await db.emailWebhookEventLog.findMany({
    where: {
      status: {
        in: [
          EmailWebhookEventStatus.PROCESSED,
          EmailWebhookEventStatus.IGNORED,
        ],
      },
      updatedAt: { lt: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    take: WEBHOOK_EVENT_CLEANUP_LIMIT,
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  const result = await db.emailWebhookEventLog.deleteMany({
    where: { id: { in: expired.map((event) => event.id) } },
  });
  return result.count;
}

/**
 * Removes recipient identity and rendered template data after the operational
 * retention period. The row itself is preserved so event metrics and the
 * idempotency guarantee continue to work.
 *
 * Records that still need retry or administrative attention are deliberately
 * excluded.
 */
export async function redactExpiredEmailOutboxPersonalData(now = new Date()) {
  const cutoff = new Date(
    now.getTime() -
      OUTBOX_PERSONAL_DATA_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
  );
  const expired = await db.emailOutbox.findMany({
    where: {
      status: {
        in: [
          EmailOutboxStatus.SENT,
          EmailOutboxStatus.DELIVERED,
          EmailOutboxStatus.CANCELED,
        ],
      },
      redactedAt: null,
      updatedAt: { lt: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    take: OUTBOX_REDACTION_LIMIT,
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  const result = await db.emailOutbox.updateMany({
    where: {
      id: { in: expired.map((email) => email.id) },
      redactedAt: null,
      status: {
        in: [
          EmailOutboxStatus.SENT,
          EmailOutboxStatus.DELIVERED,
          EmailOutboxStatus.CANCELED,
        ],
      },
    },
    data: {
      recipientUserId: null,
      recipientEmail: REDACTED_EMAIL,
      recipientName: null,
      payload: { redacted: true },
      lastErrorCode: null,
      lastErrorMessage: null,
      redactedAt: now,
    },
  });

  return result.count;
}
