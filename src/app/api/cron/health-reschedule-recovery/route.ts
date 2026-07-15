import { NextResponse } from "next/server";
import { recoverPendingAppointmentReschedules } from "@/modules/health/services/appointment-reschedule-recovery";

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

  const result = await recoverPendingAppointmentReschedules();
  return NextResponse.json({ success: true, ...result });
}
