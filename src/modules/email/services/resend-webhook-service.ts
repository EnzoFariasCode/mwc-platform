import "server-only";

import {
  EmailOutboxStatus,
  EmailWebhookEventStatus,
  Prisma,
} from "@prisma/client";
import type { WebhookEventPayload } from "resend";

import { db } from "@/lib/prisma";
import { notifyAdminsAboutEmailOutboxAttention } from "./email-outbox-attention-service";
import {
  recordDomainEmailDelivered,
  recordDomainEmailRequiresAttention,
} from "./email-outbox-domain-status";

const PROVIDER = "RESEND";
const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const ATTENTION_EVENT_TYPES = new Set([
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
]);

type WebhookResult = {
  status: "PROCESSED" | "IGNORED" | "DUPLICATE" | "BUSY";
  outboxId?: string;
};

class EmailWebhookOutboxNotReadyError extends Error {
  readonly code = "EMAIL_OUTBOX_NOT_READY";

  constructor() {
    super("A outbox ainda nao persistiu o identificador retornado pelo provedor.");
    this.name = "EmailWebhookOutboxNotReadyError";
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function safeEventDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function emailData(event: WebhookEventPayload) {
  if (!event.type.startsWith("email.") || !("email_id" in event.data)) {
    return null;
  }

  const tags = "tags" in event.data ? event.data.tags : undefined;
  return {
    providerMessageId: event.data.email_id,
    outboxId: tags?.outbox_id || null,
  };
}

function providerFailure(event: WebhookEventPayload) {
  switch (event.type) {
    case "email.bounced":
      return {
        code: "RESEND_EMAIL_BOUNCED",
        message: `Entrega rejeitada pelo servidor de destino (${event.data.bounce.type}/${event.data.bounce.subType}): ${event.data.bounce.message}`,
      };
    case "email.complained":
      return {
        code: "RESEND_EMAIL_COMPLAINED",
        message: "O destinatario marcou o e-mail como spam.",
      };
    case "email.failed":
      return {
        code: "RESEND_EMAIL_FAILED",
        message: `O Resend nao conseguiu enviar o e-mail: ${event.data.failed.reason}.`,
      };
    case "email.suppressed":
      return {
        code: "RESEND_EMAIL_SUPPRESSED",
        message: `O Resend suprimiu o envio (${event.data.suppressed.type}): ${event.data.suppressed.message}`,
      };
    default:
      return null;
  }
}

async function claimWebhookEvent({
  providerEventId,
  eventType,
  providerMessageId,
}: {
  providerEventId: string;
  eventType: string;
  providerMessageId: string | null;
}) {
  const now = new Date();

  try {
    const event = await db.emailWebhookEventLog.create({
      data: {
        provider: PROVIDER,
        providerEventId,
        eventType,
        providerMessageId,
        processingStartedAt: now,
      },
    });
    return { status: "CLAIMED" as const, event };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const existing = await db.emailWebhookEventLog.findUnique({
    where: {
      provider_providerEventId: { provider: PROVIDER, providerEventId },
    },
  });
  if (!existing) throw new Error("Evento concorrente nao localizado.");

  if (
    existing.status === EmailWebhookEventStatus.PROCESSED ||
    existing.status === EmailWebhookEventStatus.IGNORED
  ) {
    return { status: "DUPLICATE" as const, event: existing };
  }

  const staleBefore = new Date(now.getTime() - PROCESSING_LEASE_MS);
  const reclaimed = await db.emailWebhookEventLog.updateMany({
    where: {
      id: existing.id,
      OR: [
        { status: EmailWebhookEventStatus.FAILED },
        {
          status: EmailWebhookEventStatus.PROCESSING,
          OR: [
            { processingStartedAt: null },
            { processingStartedAt: { lte: staleBefore } },
          ],
        },
      ],
    },
    data: {
      status: EmailWebhookEventStatus.PROCESSING,
      eventType,
      providerMessageId,
      processingStartedAt: now,
      attemptCount: { increment: 1 },
      failedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  return reclaimed.count === 1
    ? { status: "CLAIMED" as const, event: existing }
    : { status: "BUSY" as const, event: existing };
}

export async function processResendWebhookEvent({
  providerEventId,
  event,
}: {
  providerEventId: string;
  event: WebhookEventPayload;
}): Promise<WebhookResult> {
  const data = emailData(event);
  const claim = await claimWebhookEvent({
    providerEventId,
    eventType: event.type,
    providerMessageId: data?.providerMessageId ?? null,
  });

  if (claim.status === "DUPLICATE") return { status: "DUPLICATE" };
  if (claim.status === "BUSY") return { status: "BUSY" };

  let attentionEntry: {
    id: string;
    eventType: string;
    entityType: string | null;
  } | null = null;

  try {
    const result = await db.$transaction(async (tx) => {
      if (!data) {
        await tx.emailWebhookEventLog.update({
          where: { id: claim.event.id },
          data: {
            status: EmailWebhookEventStatus.IGNORED,
            processedAt: new Date(),
            processingStartedAt: null,
          },
        });
        return { status: "IGNORED" as const };
      }

      let outbox = await tx.emailOutbox.findUnique({
        where: { providerMessageId: data.providerMessageId },
      });

      if (!outbox && data.outboxId) {
        const taggedOutbox = await tx.emailOutbox.findUnique({
          where: { id: data.outboxId },
        });
        if (taggedOutbox?.status === EmailOutboxStatus.PROCESSING) {
          throw new EmailWebhookOutboxNotReadyError();
        }
        outbox = taggedOutbox;
      }

      if (!outbox) {
        await tx.emailWebhookEventLog.update({
          where: { id: claim.event.id },
          data: {
            status: EmailWebhookEventStatus.IGNORED,
            processedAt: new Date(),
            processingStartedAt: null,
            lastErrorCode: "EMAIL_OUTBOX_NOT_FOUND",
            lastErrorMessage:
              "O evento pertence a um envio que nao foi criado pela outbox transacional.",
          },
        });
        return { status: "IGNORED" as const };
      }

      const eventAt = safeEventDate(event.created_at);

      if (event.type === "email.delivered") {
        const updated = await tx.emailOutbox.updateMany({
          where: {
            id: outbox.id,
            providerMessageId: data.providerMessageId,
            status: EmailOutboxStatus.SENT,
          },
          data: {
            status: EmailOutboxStatus.DELIVERED,
            deliveredAt: eventAt,
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        });
        if (updated.count === 1) {
          await recordDomainEmailDelivered(tx, outbox, eventAt);
        }
      } else if (event.type === "email.delivery_delayed") {
        await tx.emailOutbox.updateMany({
          where: { id: outbox.id, status: EmailOutboxStatus.SENT },
          data: {
            lastErrorCode: "RESEND_DELIVERY_DELAYED",
            lastErrorMessage:
              "O servidor de destino adiou temporariamente a entrega.",
          },
        });
      } else if (ATTENTION_EVENT_TYPES.has(event.type)) {
        const failure = providerFailure(event);
        if (failure) {
          const updated = await tx.emailOutbox.updateMany({
            where: {
              id: outbox.id,
              status: {
                in: [EmailOutboxStatus.SENT, EmailOutboxStatus.DELIVERED],
              },
            },
            data: {
              status: EmailOutboxStatus.REQUIRES_ATTENTION,
              failedAt: eventAt,
              requiresAttentionAt: eventAt,
              lastErrorCode: failure.code,
              lastErrorMessage: failure.message,
            },
          });
          if (updated.count === 1) {
            await recordDomainEmailRequiresAttention(tx, outbox, failure.message);
            attentionEntry = {
              id: outbox.id,
              eventType: outbox.eventType,
              entityType: outbox.entityType,
            };
          }
        }
      }

      await tx.emailWebhookEventLog.update({
        where: { id: claim.event.id },
        data: {
          status: EmailWebhookEventStatus.PROCESSED,
          processedAt: new Date(),
          processingStartedAt: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });
      return { status: "PROCESSED" as const, outboxId: outbox.id };
    });

    if (attentionEntry) {
      await notifyAdminsAboutEmailOutboxAttention(attentionEntry).catch(
        (error) => {
          console.error("[RESEND_WEBHOOK_ADMIN_NOTIFICATION_ERROR]", {
            outboxId: attentionEntry?.id,
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
        },
      );
    }
    return result;
  } catch (error) {
    const errorCode =
      error instanceof EmailWebhookOutboxNotReadyError
        ? error.code
        : "RESEND_WEBHOOK_PROCESSING_FAILED";
    const errorMessage =
      error instanceof EmailWebhookOutboxNotReadyError
        ? error.message
        : "O evento autenticado nao pode ser processado.";

    await db.emailWebhookEventLog.updateMany({
      where: {
        id: claim.event.id,
        status: EmailWebhookEventStatus.PROCESSING,
      },
      data: {
        status: EmailWebhookEventStatus.FAILED,
        processingStartedAt: null,
        failedAt: new Date(),
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      },
    });
    throw error;
  }
}
