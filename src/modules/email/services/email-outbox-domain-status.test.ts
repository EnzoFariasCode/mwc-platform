import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Prisma } from "@prisma/client";
import {
  recordDomainEmailDelivered,
  recordDomainEmailRequiresAttention,
} from "./email-outbox-domain-status";

function makeClient() {
  return {
    withdrawalRequest: { updateMany: vi.fn() },
    professionalVerification: { updateMany: vi.fn() },
    chatReport: { updateMany: vi.fn() },
    emailOutbox: { count: vi.fn().mockResolvedValue(0) },
  } as unknown as Prisma.TransactionClient;
}

describe("email outbox domain status", () => {
  it("marca a entrega do comprovante sem confundir com o aviso de solicitacao", async () => {
    const client = makeClient();
    const deliveredAt = new Date("2026-08-25T12:00:00.000Z");

    await recordDomainEmailDelivered(
      client,
      {
        eventType: "FINANCE_WITHDRAWAL_REQUESTED",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: "withdrawal_1",
        idempotencyKey:
          "FINANCE_WITHDRAWAL_REQUESTED:withdrawal_1:professional_1",
      },
      deliveredAt,
    );
    expect(client.withdrawalRequest.updateMany).not.toHaveBeenCalled();

    await recordDomainEmailDelivered(
      client,
      {
        eventType: "FINANCE_WITHDRAWAL_PAID",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: "withdrawal_1",
        idempotencyKey:
          "FINANCE_WITHDRAWAL_PAID:withdrawal_1:professional_1",
      },
      deliveredAt,
    );
    expect(client.withdrawalRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "withdrawal_1", status: "COMPLETED" },
      data: expect.objectContaining({ receiptEmailSentAt: deliveredAt }),
    });
  });

  it("registra falha final no dominio para permitir acao administrativa", async () => {
    const client = makeClient();

    await recordDomainEmailRequiresAttention(
      client,
      {
        eventType: "ADMIN_VERIFICATION_DECISION_APPROVED",
        entityType: "PROFESSIONAL_VERIFICATION",
        entityId: "verification_1",
      },
      "Entrega esgotou as tentativas.",
    );

    expect(client.professionalVerification.updateMany).toHaveBeenCalledWith({
      where: { id: "verification_1" },
      data: expect.objectContaining({
        decisionNotifiedAt: null,
        decisionEmailError: "Entrega esgotou as tentativas.",
      }),
    });
  });

  it("so confirma a notificacao da denuncia quando todos os emails foram entregues", async () => {
    const client = makeClient();
    const deliveredAt = new Date("2026-08-25T12:00:00.000Z");

    await recordDomainEmailDelivered(
      client,
      {
        eventType: "ADMIN_CHAT_REPORT_DECISION_WARNING",
        entityType: "CHAT_REPORT",
        entityId: "report_1",
        idempotencyKey: "ADMIN_CHAT_REPORT_DECISION:report_1:user_1",
      },
      deliveredAt,
    );

    expect(client.emailOutbox.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: { not: "DELIVERED" } }),
    });
    expect(client.chatReport.updateMany).toHaveBeenCalledWith({
      where: { id: "report_1" },
      data: { decisionNotifiedAt: deliveredAt, decisionEmailError: null },
    });
  });
});
