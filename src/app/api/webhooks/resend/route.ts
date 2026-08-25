import { NextResponse } from "next/server";

import { verifyResendWebhook } from "@/modules/email/email-client";
import { processResendWebhookEvent } from "@/modules/email/services/resend-webhook-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[RESEND_WEBHOOK_CONFIG_ERROR]", {
      hasWebhookSecret: false,
    });
    return NextResponse.json(
      { success: false, error: "Webhook de e-mail nao configurado." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json(
      { success: false, error: "Assinatura do webhook ausente." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawBody = await request.text();
  let event;
  try {
    event = verifyResendWebhook({
      payload: rawBody,
      id,
      timestamp,
      signature,
      webhookSecret,
    });
  } catch (error) {
    console.warn("[RESEND_WEBHOOK_SIGNATURE_REJECTED]", {
      eventId: id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Assinatura do webhook invalida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await processResendWebhookEvent({
      providerEventId: id,
      event,
    });
    if (result.status === "BUSY") {
      return NextResponse.json(
        { success: false, status: result.status },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "30",
          },
        },
      );
    }
    return NextResponse.json(
      { success: true, status: result.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[RESEND_WEBHOOK_PROCESSING_ERROR]", {
      eventId: id,
      eventType: event.type,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Falha temporaria ao processar o webhook." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
