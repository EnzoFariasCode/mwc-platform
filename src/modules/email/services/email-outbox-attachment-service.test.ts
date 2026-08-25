import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ db: { $queryRaw: queryRaw } }));

import {
  EmailOutboxAttachmentError,
  resolveEmailOutboxAttachments,
} from "./email-outbox-attachment-service";

describe("email outbox attachment service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("carrega o comprovante protegido apenas para o saque correspondente", async () => {
    queryRaw.mockResolvedValue([
      {
        receiptFileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        receiptFileType: "application/pdf",
        receiptFileName: "comprovante.pdf",
      },
    ]);

    const attachments = await resolveEmailOutboxAttachments({
      templateKey: "finance.withdrawal.paid",
      entityType: "WITHDRAWAL_REQUEST",
      entityId: "withdrawal_1",
      payload: {
        attachmentAuditLogId: "b889b566-b6c4-4c8f-81f8-a426098b9c45",
      },
    } as never);

    expect(attachments).toEqual([
      expect.objectContaining({
        filename: "comprovante.pdf",
        contentType: "application/pdf",
      }),
    ]);
    expect(Buffer.isBuffer(attachments?.[0].content)).toBe(true);
  });

  it("interrompe o envio quando o comprovante nao existe", async () => {
    queryRaw.mockResolvedValue([]);

    await expect(
      resolveEmailOutboxAttachments({
        templateKey: "finance.withdrawal.paid",
        entityType: "WITHDRAWAL_REQUEST",
        entityId: "withdrawal_1",
        payload: {
          attachmentAuditLogId: "b889b566-b6c4-4c8f-81f8-a426098b9c45",
        },
      } as never),
    ).rejects.toBeInstanceOf(EmailOutboxAttachmentError);
  });
});
