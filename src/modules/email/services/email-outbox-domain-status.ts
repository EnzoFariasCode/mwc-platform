import "server-only";

import { EmailOutboxStatus, type EmailOutbox, type Prisma } from "@prisma/client";

type DomainStatusClient = Pick<
  Prisma.TransactionClient,
  | "withdrawalRequest"
  | "professionalVerification"
  | "chatReport"
  | "emailOutbox"
>;

export async function recordDomainEmailDelivered(
  client: DomainStatusClient,
  email: Pick<
    EmailOutbox,
    "eventType" | "entityType" | "entityId" | "idempotencyKey"
  >,
  deliveredAt: Date,
) {
  if (email.entityType === "WITHDRAWAL_REQUEST" && email.entityId) {
    if (
      [
        "FINANCE_WITHDRAWAL_PAID",
        "FINANCE_WITHDRAWAL_RECEIPT_ATTACHED",
        "FINANCE_WITHDRAWAL_RECEIPT_RESENT",
      ].includes(email.eventType)
    ) {
      await client.withdrawalRequest.updateMany({
        where: { id: email.entityId, status: "COMPLETED" },
        data: {
          receiptEmailAttempts: { increment: 1 },
          receiptEmailSentAt: deliveredAt,
          receiptEmailFailureReason: null,
        },
      });
    }
    return;
  }

  if (
    email.entityType === "PROFESSIONAL_VERIFICATION" &&
    email.entityId &&
    email.eventType.startsWith("ADMIN_VERIFICATION_DECISION")
  ) {
    await client.professionalVerification.updateMany({
      where: { id: email.entityId },
      data: {
        decisionEmailAttempts: { increment: 1 },
        decisionNotifiedAt: deliveredAt,
        decisionEmailError: null,
      },
    });
    return;
  }

  if (
    email.entityType === "CHAT_REPORT" &&
    email.entityId &&
    email.eventType.startsWith("ADMIN_CHAT_REPORT_DECISION")
  ) {
    const keyParts = email.idempotencyKey.split(":");
    const groupPrefix = email.eventType.startsWith(
      "ADMIN_CHAT_REPORT_DECISION_RETRY_",
    )
      ? `${keyParts.slice(0, 2).join(":")}:`
      : `ADMIN_CHAT_REPORT_DECISION:${email.entityId}:`;
    const remaining = await client.emailOutbox.count({
      where: {
        entityType: "CHAT_REPORT",
        entityId: email.entityId,
        idempotencyKey: { startsWith: groupPrefix },
        status: { not: EmailOutboxStatus.DELIVERED },
      },
    });
    if (remaining === 0) {
      await client.chatReport.updateMany({
        where: { id: email.entityId },
        data: { decisionNotifiedAt: deliveredAt, decisionEmailError: null },
      });
    }
  }
}

export async function recordDomainEmailRequiresAttention(
  client: DomainStatusClient,
  email: Pick<EmailOutbox, "eventType" | "entityType" | "entityId">,
  message: string,
) {
  if (email.entityType === "WITHDRAWAL_REQUEST" && email.entityId) {
    if (
      [
        "FINANCE_WITHDRAWAL_PAID",
        "FINANCE_WITHDRAWAL_RECEIPT_ATTACHED",
        "FINANCE_WITHDRAWAL_RECEIPT_RESENT",
      ].includes(email.eventType)
    ) {
      await client.withdrawalRequest.updateMany({
        where: { id: email.entityId },
        data: {
          receiptEmailAttempts: { increment: 1 },
          receiptEmailFailureReason: message,
        },
      });
    }
    return;
  }

  if (
    email.entityType === "PROFESSIONAL_VERIFICATION" &&
    email.entityId &&
    email.eventType.startsWith("ADMIN_VERIFICATION_DECISION")
  ) {
    await client.professionalVerification.updateMany({
      where: { id: email.entityId },
      data: {
        decisionEmailAttempts: { increment: 1 },
        decisionNotifiedAt: null,
        decisionEmailError: message,
      },
    });
    return;
  }

  if (
    email.entityType === "CHAT_REPORT" &&
    email.entityId &&
    email.eventType.startsWith("ADMIN_CHAT_REPORT_DECISION")
  ) {
    await client.chatReport.updateMany({
      where: { id: email.entityId },
      data: { decisionNotifiedAt: null, decisionEmailError: message },
    });
  }
}
