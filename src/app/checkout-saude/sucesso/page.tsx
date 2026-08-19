import { HealthCheckoutStatusCard } from "@/modules/health/components/health-checkout-status-card";
import { getHealthPaymentStatus } from "@/modules/health/actions/get-health-payment-status";

export const dynamic = "force-dynamic";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  const paymentStatus = sessionId
    ? await getHealthPaymentStatus(sessionId)
    : {
        state: "NOT_FOUND" as const,
        message: "Não foi possível localizar a sessão do pagamento.",
      };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] p-4 font-poppins text-white">
      <HealthCheckoutStatusCard
        sessionId={sessionId}
        initialStatus={paymentStatus}
      />
    </main>
  );
}
