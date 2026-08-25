"use server";

import { EmailOutboxStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { consumeRateLimit } from "@/lib/action-rate-limit";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { adminEmailAccessWhere } from "@/modules/admin/lib/admin-email-access";
import { createAdminAuditLog } from "./audit-log";

// FAILED remains eligible for the automatic processor. Creating an
// administrative retry for it would leave two messages able to be sent.
const RETRYABLE_STATUSES = new Set<EmailOutboxStatus>([
  EmailOutboxStatus.REQUIRES_ATTENTION,
]);

export async function retryEmailOutboxAdmin(formData: FormData) {
  const admin = await requireAdminRole(["OWNER", "FINANCE", "SUPPORT"]);
  const outboxId = String(formData.get("outboxId") || "").trim();
  if (!outboxId) redirect("/dashboard/admin/emails?result=invalid");

  const rateLimitError = await consumeRateLimit({
    key: `admin:email-outbox-retry:user:${admin.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
    message: "Muitas novas tentativas em sequencia.",
  });
  if (rateLimitError) {
    redirect(`/dashboard/admin/emails/${outboxId}?result=rate-limited`);
  }

  let retryId: string | null = null;
  let result = "queued";
  try {
    await db.$transaction(async (tx) => {
      const source = await tx.emailOutbox.findFirst({
        where: {
          AND: [{ id: outboxId }, adminEmailAccessWhere(admin.adminRole)],
        },
        include: { retry: { select: { id: true } } },
      });
      if (!source || !RETRYABLE_STATUSES.has(source.status)) {
        result = "not-retryable";
        return;
      }
      if (source.retry) {
        retryId = source.retry.id;
        result = "already-queued";
        return;
      }

      const audit = await createAdminAuditLog(tx, {
        actorId: admin.id,
        action: "EMAIL_OUTBOX_RETRY_QUEUED",
        entityType: "EMAIL_OUTBOX",
        entityId: source.id,
        reason: "Nova tentativa administrativa registrada.",
        metadata: {
          sourceStatus: source.status,
          sourceAttemptCount: source.attemptCount,
          providerMessageId: source.providerMessageId,
        },
      });
      const retry = await tx.emailOutbox.create({
        data: {
          idempotencyKey: `ADMIN_EMAIL_RETRY:${source.id}:${audit.id}`,
          eventType: source.eventType,
          templateKey: source.templateKey,
          templateVersion: source.templateVersion,
          recipientUserId: source.recipientUserId,
          recipientEmail: source.recipientEmail,
          recipientName: source.recipientName,
          entityType: source.entityType,
          entityId: source.entityId,
          payload: source.payload as Prisma.InputJsonValue,
          priority: Math.max(0, source.priority - 10),
          maxAttempts: source.maxAttempts,
          nextAttemptAt: new Date(),
          retryOfId: source.id,
        },
      });
      retryId = retry.id;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      result = "already-queued";
      retryId = (
        await db.emailOutbox.findUnique({
          where: { retryOfId: outboxId },
          select: { id: true },
        })
      )?.id ?? null;
    } else {
      console.error("[ADMIN_EMAIL_OUTBOX_RETRY_ERROR]", {
        outboxId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      result = "error";
    }
  }

  revalidatePath("/dashboard/admin/emails");
  revalidatePath(`/dashboard/admin/emails/${outboxId}`);
  redirect(
    retryId
      ? `/dashboard/admin/emails/${retryId}?result=${result}`
      : `/dashboard/admin/emails/${outboxId}?result=${result}`,
  );
}
