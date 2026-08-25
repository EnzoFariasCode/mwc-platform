import { EmailWebhookEventStatus, Prisma } from "@prisma/client";
import type { WebhookEventPayload } from "resend";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventCreate: vi.fn(),
  eventFindUnique: vi.fn(),
  eventUpdateMany: vi.fn(),
  txEventUpdate: vi.fn(),
  outboxFindUnique: vi.fn(),
  outboxUpdateMany: vi.fn(),
  transaction: vi.fn(),
  recordDelivered: vi.fn(),
  recordAttention: vi.fn(),
  notifyAttention: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    emailWebhookEventLog: {
      create: mocks.eventCreate,
      findUnique: mocks.eventFindUnique,
      updateMany: mocks.eventUpdateMany,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("./email-outbox-domain-status", () => ({
  recordDomainEmailDelivered: mocks.recordDelivered,
  recordDomainEmailRequiresAttention: mocks.recordAttention,
}));
vi.mock("./email-outbox-attention-service", () => ({
  notifyAdminsAboutEmailOutboxAttention: mocks.notifyAttention,
}));

import { processResendWebhookEvent } from "./resend-webhook-service";

const outbox = {
  id: "outbox_1",
  eventType: "TECH_PROPOSAL_RECEIVED",
  entityType: "PROJECT",
  entityId: "project_1",
  idempotencyKey: "TECH_PROPOSAL_RECEIVED:proposal_1:client_1",
  status: "SENT",
};

function deliveredEvent(): WebhookEventPayload {
  return {
    type: "email.delivered",
    created_at: "2026-08-25T16:00:00.000Z",
    data: {
      created_at: "2026-08-25T15:59:59.000Z",
      email_id: "resend_1",
      from: "MWC <no-reply@example.com>",
      to: ["client@example.com"],
      subject: "Nova proposta",
      tags: { outbox_id: "outbox_1" },
    },
  };
}

describe("Resend webhook service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventCreate.mockResolvedValue({ id: "event_log_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        emailWebhookEventLog: { update: mocks.txEventUpdate },
        emailOutbox: {
          findUnique: mocks.outboxFindUnique,
          updateMany: mocks.outboxUpdateMany,
        },
      }),
    );
    mocks.outboxFindUnique.mockResolvedValue(outbox);
    mocks.outboxUpdateMany.mockResolvedValue({ count: 1 });
    mocks.txEventUpdate.mockResolvedValue({});
    mocks.recordDelivered.mockResolvedValue(undefined);
    mocks.recordAttention.mockResolvedValue(undefined);
    mocks.notifyAttention.mockResolvedValue({ recipientCount: 1, failed: 0 });
  });

  it("marca como entregue usando o identificador do provedor", async () => {
    const result = await processResendWebhookEvent({
      providerEventId: "svix_event_1",
      event: deliveredEvent(),
    });

    expect(result).toEqual({ status: "PROCESSED", outboxId: "outbox_1" });
    expect(mocks.outboxUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ providerMessageId: "resend_1" }),
        data: expect.objectContaining({ status: "DELIVERED" }),
      }),
    );
    expect(mocks.recordDelivered).toHaveBeenCalledOnce();
  });

  it("leva bounce para atencao e alerta administradores uma unica vez", async () => {
    const event: WebhookEventPayload = {
      ...deliveredEvent(),
      type: "email.bounced",
      data: {
        ...deliveredEvent().data,
        bounce: {
          type: "Permanent",
          subType: "General",
          message: "Mailbox unavailable",
        },
      },
    } as WebhookEventPayload;

    const result = await processResendWebhookEvent({
      providerEventId: "svix_event_bounce",
      event,
    });

    expect(result.status).toBe("PROCESSED");
    expect(mocks.outboxUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REQUIRES_ATTENTION",
          lastErrorCode: "RESEND_EMAIL_BOUNCED",
        }),
      }),
    );
    expect(mocks.recordAttention).toHaveBeenCalledOnce();
    expect(mocks.notifyAttention).toHaveBeenCalledOnce();
  });

  it("ignora replay de evento ja processado sem repetir efeitos", async () => {
    mocks.eventCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "6.19.1",
      }),
    );
    mocks.eventFindUnique.mockResolvedValue({
      id: "event_log_1",
      status: EmailWebhookEventStatus.PROCESSED,
    });

    const result = await processResendWebhookEvent({
      providerEventId: "svix_event_1",
      event: deliveredEvent(),
    });

    expect(result.status).toBe("DUPLICATE");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.outboxUpdateMany).not.toHaveBeenCalled();
  });

  it("ignora com seguranca e-mail legado que nao pertence a outbox", async () => {
    mocks.outboxFindUnique.mockResolvedValue(null);
    const event: WebhookEventPayload = {
      type: "email.delivered",
      created_at: "2026-08-25T16:00:00.000Z",
      data: {
        created_at: "2026-08-25T15:59:59.000Z",
        email_id: "resend_legacy",
        from: "MWC <no-reply@example.com>",
        to: ["client@example.com"],
        subject: "E-mail legado",
      },
    };

    const result = await processResendWebhookEvent({
      providerEventId: "svix_event_legacy",
      event,
    });

    expect(result.status).toBe("IGNORED");
    expect(mocks.txEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastErrorCode: "EMAIL_OUTBOX_NOT_FOUND" }),
      }),
    );
  });
});
