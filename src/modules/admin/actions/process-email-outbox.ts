"use server";

import { redirect } from "next/navigation";

import { consumeRateLimit } from "@/lib/action-rate-limit";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { processEmailOutbox } from "@/modules/email/services/email-outbox-processor";
import { createAdminAuditLog } from "./audit-log";

export async function processEmailOutboxAdmin() {
  const admin = await requireAdminRole(["OWNER"]);
  const rateLimitError = await consumeRateLimit({
    key: `admin:email-outbox-process:user:${admin.id}`,
    limit: 5,
    windowMs: 10 * 60 * 1_000,
    message: "Limite de processamentos manuais atingido.",
  });
  if (rateLimitError) {
    redirect("/dashboard/admin/emails?result=process-rate-limited");
  }

  const metrics = await processEmailOutbox({
    batchSize: 50,
    concurrency: 5,
  });

  await db.$transaction((tx) =>
    createAdminAuditLog(tx, {
      actorId: admin.id,
      action: "EMAIL_OUTBOX_MANUALLY_PROCESSED",
      entityType: "EMAIL_OUTBOX",
      entityId: "BATCH",
      reason: "Processamento manual da caixa de saida pelo painel.",
      metadata: metrics,
    }),
  );

  const params = new URLSearchParams({
    result: "processed",
    inspected: String(metrics.inspected),
    sent: String(metrics.sent),
    retryScheduled: String(metrics.retryScheduled),
    attention: String(metrics.requiresAttention),
  });
  redirect(`/dashboard/admin/emails?${params.toString()}`);
}
