import "server-only";

import type { EmailOutbox } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/prisma";
import type { SendEmailInput } from "@/modules/email/email-client";

const attachmentPayloadSchema = z.object({
  attachmentAuditLogId: z.string().uuid(),
});

type ReceiptRow = {
  receiptFileBytes: Uint8Array;
  receiptFileType: string;
  receiptFileName: string;
};

export class EmailOutboxAttachmentError extends Error {
  readonly code = "EMAIL_ATTACHMENT_UNAVAILABLE";

  constructor() {
    super("O anexo protegido do e-mail nao esta disponivel.");
    this.name = "EmailOutboxAttachmentError";
  }
}

export async function resolveEmailOutboxAttachments(
  email: Pick<EmailOutbox, "templateKey" | "entityType" | "entityId" | "payload">,
): Promise<SendEmailInput["attachments"]> {
  if (email.templateKey !== "finance.withdrawal.paid") return undefined;
  if (email.entityType !== "WITHDRAWAL_REQUEST" || !email.entityId) {
    throw new EmailOutboxAttachmentError();
  }

  const parsed = attachmentPayloadSchema.safeParse(email.payload);
  if (!parsed.success) throw new EmailOutboxAttachmentError();

  const rows = await db.$queryRaw<ReceiptRow[]>`
    SELECT
      "receiptFileBytes",
      "receiptFileType",
      "receiptFileName"
    FROM "AdminAuditLog"
    WHERE "id" = ${parsed.data.attachmentAuditLogId}
      AND "entityType" = 'WITHDRAWAL_REQUEST'
      AND "entityId" = ${email.entityId}
      AND "receiptFileBytes" IS NOT NULL
      AND "receiptFileType" IS NOT NULL
      AND "receiptFileName" IS NOT NULL
    LIMIT 1
  `;
  const receipt = rows[0];
  if (!receipt) throw new EmailOutboxAttachmentError();

  return [
    {
      content: Buffer.from(receipt.receiptFileBytes),
      filename: receipt.receiptFileName,
      contentType: receipt.receiptFileType,
    },
  ];
}
