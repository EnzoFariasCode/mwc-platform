import { NextResponse } from "next/server";
import { recoverPendingAppointmentMeetings } from "@/modules/health/services/appointment-meeting-recovery";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET nao configurado." },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const result = await recoverPendingAppointmentMeetings();
    const executedAt = new Date().toISOString();

    console.info("[HEALTH_MEETING_RECOVERY_METRICS]", {
      executedAt,
      ...result,
    });

    return NextResponse.json(
      { success: true, executedAt, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no recovery.";
    console.error("[HEALTH_MEETING_RECOVERY_CRON_ERROR]", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
