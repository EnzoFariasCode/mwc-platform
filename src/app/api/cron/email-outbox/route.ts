import { NextResponse } from "next/server";

import { processEmailOutbox } from "@/modules/email/services/email-outbox-processor";
import {
  cleanupEmailWebhookEventLogs,
  markEmailOutboxCronFailed,
  markEmailOutboxCronStarted,
  markEmailOutboxCronSucceeded,
} from "@/modules/email/services/email-operations-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret) {
    console.error("[EMAIL_OUTBOX_CRON_CONFIG_ERROR]", {
      hasCronSecret: false,
    });
    return NextResponse.json(
      { success: false, error: "Agendador nao configurado." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: "Nao autorizado." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const startedAt = new Date();
  try {
    await markEmailOutboxCronStarted(startedAt);
    const metrics = await processEmailOutbox();
    const purgedWebhookEvents = await cleanupEmailWebhookEventLogs();
    const completedAt = new Date();
    const operationalMetrics = { ...metrics, purgedWebhookEvents };
    await markEmailOutboxCronSucceeded({
      startedAt,
      completedAt,
      metrics: operationalMetrics,
    });
    return NextResponse.json(
      {
        success: true,
        executedAt: completedAt.toISOString(),
        ...operationalMetrics,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    try {
      await markEmailOutboxCronFailed({
        startedAt,
        failedAt: new Date(),
        error,
      });
    } catch (heartbeatError) {
      console.error("[EMAIL_OUTBOX_HEARTBEAT_ERROR]", {
        errorName:
          heartbeatError instanceof Error
            ? heartbeatError.name
            : "UnknownError",
      });
    }
    console.error("[EMAIL_OUTBOX_CRON_ERROR]", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Falha ao processar a fila de e-mails." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
