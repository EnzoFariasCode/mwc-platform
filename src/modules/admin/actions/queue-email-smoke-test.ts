"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { consumeRateLimit } from "@/lib/action-rate-limit";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { enqueueTransactionalEmail } from "@/modules/email/services/email-outbox-service";
import { createAdminAuditLog } from "./audit-log";

export async function queueEmailSmokeTestAdmin() {
  const admin = await requireAdminRole(["OWNER"]);
  const rateLimitError = await consumeRateLimit({
    key: `admin:email-smoke-test:user:${admin.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1_000,
    message: "Limite de testes de e-mail atingido.",
  });
  if (rateLimitError) {
    redirect("/dashboard/admin/emails?result=smoke-rate-limited");
  }

  const runId = randomUUID();
  const queuedAt = new Date();
  const outboxId = await db.$transaction(async (tx) => {
    const recipient = await tx.user.findUnique({
      where: { id: admin.id },
      select: { id: true, email: true, name: true, displayName: true },
    });
    if (!recipient?.email) {
      throw new Error("Administrador sem e-mail para o teste operacional.");
    }

    const queued = await enqueueTransactionalEmail(tx, {
      idempotencyKey: `SYSTEM_EMAIL_SMOKE_TEST:${runId}:${recipient.id}`,
      eventType: "SYSTEM_EMAIL_SMOKE_TEST",
      templateKey: "system.smoke-test",
      templateVersion: 1,
      recipientUserId: recipient.id,
      recipientEmail: recipient.email,
      recipientName: recipient.displayName || recipient.name,
      entityType: "EMAIL_OUTBOX_TEST",
      entityId: runId,
      priority: 10,
      payload: {
        message: `Teste solicitado pelo painel administrativo em ${queuedAt.toISOString()}.`,
      },
    });

    await createAdminAuditLog(tx, {
      actorId: admin.id,
      action: "EMAIL_OUTBOX_SMOKE_TEST_QUEUED",
      entityType: "EMAIL_OUTBOX",
      entityId: queued.email.id,
      reason: "Teste operacional controlado da caixa de saida.",
      metadata: { runId },
    });
    return queued.email.id;
  });

  redirect(`/dashboard/admin/emails/${outboxId}?result=smoke-queued`);
}
