import { NextResponse } from "next/server";

import { checkStripePaymentMethods } from "@/modules/stripe/services/payment-method-health";

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
    const result = await checkStripePaymentMethods();
    return NextResponse.json(result, { status: result.healthy ? 200 : 503 });
  } catch (error) {
    console.error("[STRIPE_PAYMENT_METHOD_HEALTH]", error);
    return NextResponse.json(
      {
        healthy: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao validar os metodos de pagamento.",
      },
      { status: 503 },
    );
  }
}
