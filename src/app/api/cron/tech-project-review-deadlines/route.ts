import { NextResponse } from "next/server";
import { processTechProjectReviewDeadlines } from "@/modules/projects/services/tech-project-review-deadline-service";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET nao configurado." },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const result = await processTechProjectReviewDeadlines();
  return NextResponse.json({ success: result.errors === 0, ...result });
}
