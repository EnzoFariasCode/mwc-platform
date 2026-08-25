import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertNotification = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification,
}));

import type { Prisma } from "@prisma/client";
import {
  enqueueAdminNotificationEmails,
  enqueueWithdrawalPaidEmail,
  enqueueWithdrawalRequestedEmail,
} from "./admin-finance-email-service";

function makeClient() {
  return {
    emailOutbox: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation(({ data }) => ({ id: "email_1", ...data })),
    },
    emailDeliveryAttempt: {},
    notification: {},
    user: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "owner_1",
          email: "owner@example.com",
          name: "Owner",
          displayName: null,
          adminRole: "OWNER",
        },
        {
          id: "finance_1",
          email: "finance@example.com",
          name: "Financeiro",
          displayName: null,
          adminRole: "FINANCE",
        },
        {
          id: "support_1",
          email: "support@example.com",
          name: "Suporte",
          displayName: null,
          adminRole: "SUPPORT",
        },
      ]),
    },
  } as unknown as Prisma.TransactionClient;
}

describe("admin and finance email service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registra o saque solicitado com chave idempotente", async () => {
    const client = makeClient();

    await enqueueWithdrawalRequestedEmail(client, {
      withdrawalId: "withdrawal_1",
      recipient: {
        id: "professional_1",
        email: "PRO@example.com",
        name: "Profissional",
      },
      amount: "R$ 100,00",
      pixKey: "pix@example.com",
      pixKeyType: "EMAIL",
      dueAt: "10/09/2026",
      actionPath: "/dashboard/financeiro",
    });

    expect(client.emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey:
          "FINANCE_WITHDRAWAL_REQUESTED:withdrawal_1:professional_1",
        recipientEmail: "pro@example.com",
        templateKey: "finance.withdrawal.requested",
      }),
    });
  });

  it("referencia o comprovante sem copiar bytes para o payload", async () => {
    const client = makeClient();

    await enqueueWithdrawalPaidEmail(client, {
      idempotencyKey: "FINANCE_WITHDRAWAL_PAID:withdrawal_1:professional_1",
      withdrawalId: "withdrawal_1",
      recipient: {
        id: "professional_1",
        email: "pro@example.com",
        name: "Profissional",
      },
      amount: "R$ 100,00",
      pixKey: "pix@example.com",
      pixKeyType: "EMAIL",
      providerRef: "E2E12345",
      processedAt: "10/09/2026 10:00",
      receiptAuditLogId: "b889b566-b6c4-4c8f-81f8-a426098b9c45",
      actionPath: "/dashboard/financeiro",
    });

    const serialized = JSON.stringify(
      vi.mocked(client.emailOutbox.create).mock.calls,
    );
    expect(serialized).toContain("attachmentAuditLogId");
    expect(serialized).not.toContain("receiptFileBytes");
  });

  it("filtra papeis administrativos e registra notificacao e e-mail juntos", async () => {
    const client = makeClient();

    await enqueueAdminNotificationEmails(client, {
      eventType: "ADMIN_WITHDRAWAL_REQUESTED",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: "withdrawal_1",
      roles: ["OWNER", "FINANCE"],
      title: "Novo saque",
      summary: "Existe um saque pendente.",
      lines: ["Revise o saque."],
      actionPath: "/dashboard/admin/financeiro",
      notification: {},
    });

    expect(client.emailOutbox.create).toHaveBeenCalledTimes(2);
    expect(upsertNotification).toHaveBeenCalledTimes(2);
    expect(client.emailOutbox.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientEmail: "support@example.com" }),
      }),
    );
  });
});
