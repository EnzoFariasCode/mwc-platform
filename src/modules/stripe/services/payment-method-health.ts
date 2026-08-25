import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import {
  evaluatePaymentMethodConfiguration,
  CUSTOMER_PAYMENT_METHODS,
  type StripePaymentConfigurationSnapshot,
} from "@/modules/stripe/lib/payment-methods";

async function getPaymentMethodConfiguration() {
  const configuredId = process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION_ID;

  if (configuredId) {
    return stripe.paymentMethodConfigurations.retrieve(configuredId);
  }

  const configurations = await stripe.paymentMethodConfigurations.list({
    limit: 100,
  });
  const defaultConfiguration = configurations.data.find(
    (configuration) =>
      configuration.is_default && configuration.parent === null,
  );

  if (!defaultConfiguration) {
    throw new Error(
      "Nenhuma configuracao padrao de metodos de pagamento foi encontrada na Stripe.",
    );
  }

  return defaultConfiguration;
}

function createSnapshot(
  configuration: Awaited<ReturnType<typeof getPaymentMethodConfiguration>>,
): StripePaymentConfigurationSnapshot {
  return {
    id: configuration.id,
    active: configuration.active,
    isDefault: configuration.is_default,
    livemode: configuration.livemode,
    available: {
      card: configuration.card?.available ?? false,
      pix: configuration.pix?.available ?? false,
    },
  };
}

const getCachedPublicPaymentMethods = unstable_cache(
  async () => {
    const configuration = await getPaymentMethodConfiguration();
    const snapshot = createSnapshot(configuration);

    if (!snapshot.active) return [];

    return CUSTOMER_PAYMENT_METHODS.filter(
      (method) => snapshot.available[method.id],
    );
  },
  ["stripe-public-payment-methods"],
  { revalidate: 60 * 60 },
);

function hasUsableStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}

export async function getPublicPaymentMethods() {
  // Local builds commonly use an explicit placeholder. Avoid making an
  // external request that is guaranteed to fail while keeping production
  // fail-closed when the real Stripe configuration cannot be read.
  if (!hasUsableStripeSecretKey()) return [];

  try {
    return await getCachedPublicPaymentMethods();
  } catch (error) {
    console.error("[STRIPE_PUBLIC_PAYMENT_METHODS]", error);
    return [];
  }
}

async function notifyAdmins(issues: string[], configurationId: string) {
  const admins = await db.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: { id: true },
  });
  const message = issues.join(" ");

  await Promise.all(
    admins.map((admin) =>
      upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType: "STRIPE_PAYMENT_METHOD_CONFIGURATION_INVALID",
        title: "Configuracao de pagamento Stripe requer atencao",
        message,
        link: "/dashboard/admin",
        entityType: "STRIPE_PAYMENT_METHOD_CONFIGURATION",
        entityId: configurationId,
        metadata: { issues },
      }),
    ),
  );
}

export async function checkStripePaymentMethods() {
  let configuration: Awaited<ReturnType<typeof getPaymentMethodConfiguration>>;

  try {
    configuration = await getPaymentMethodConfiguration();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha ao consultar a configuracao Stripe.";
    await notifyAdmins([message], "configuration-lookup-failure");
    throw error;
  }

  const snapshot = createSnapshot(configuration);
  const result = evaluatePaymentMethodConfiguration({
    configuration: snapshot,
    requireLiveMode: process.env.VERCEL_ENV === "production",
  });

  if (!result.healthy) {
    await notifyAdmins(result.issues, configuration.id);
  }

  return {
    ...result,
    configuration: snapshot,
    checkedAt: new Date().toISOString(),
  };
}
