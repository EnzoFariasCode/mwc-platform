import type Stripe from "stripe";

export type CheckoutPaymentMethod = NonNullable<
  Stripe.Checkout.SessionCreateParams["payment_method_types"]
>[number];

export const ONE_TIME_PAYMENT_METHODS = ["card"] as const satisfies readonly CheckoutPaymentMethod[];
export const SUBSCRIPTION_PAYMENT_METHODS = ["card"] as const satisfies readonly CheckoutPaymentMethod[];

export const CUSTOMER_PAYMENT_METHODS = [
  {
    id: "card",
    label: "Cartao de credito",
    description: "Pagamento por cartao processado no checkout da Stripe.",
  },
] as const;

export type CustomerPaymentMethodInfo =
  (typeof CUSTOMER_PAYMENT_METHODS)[number];

export type StripePaymentConfigurationSnapshot = {
  id: string;
  active: boolean;
  isDefault: boolean;
  livemode: boolean;
  available: Partial<Record<"card" | "pix", boolean>>;
};

export function evaluatePaymentMethodConfiguration({
  configuration,
  requireLiveMode,
}: {
  configuration: StripePaymentConfigurationSnapshot;
  requireLiveMode: boolean;
}) {
  const requiredMethods = Array.from(
    new Set([...ONE_TIME_PAYMENT_METHODS, ...SUBSCRIPTION_PAYMENT_METHODS]),
  );
  const issues: string[] = [];

  if (!configuration.active) {
    issues.push("A configuracao de metodos de pagamento esta inativa.");
  }
  if (requireLiveMode && !configuration.livemode) {
    issues.push("A producao esta vinculada a uma configuracao Stripe de teste.");
  }

  for (const method of requiredMethods) {
    if (!configuration.available[method as "card" | "pix"]) {
      issues.push(`O metodo ${method} nao esta disponivel na Stripe.`);
    }
  }

  return {
    healthy: issues.length === 0,
    requiredMethods,
    advertisedMethods: CUSTOMER_PAYMENT_METHODS.map((method) => method.id),
    issues,
  };
}
