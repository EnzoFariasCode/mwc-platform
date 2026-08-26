import "server-only";

import type Stripe from "stripe";

import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type BillingPortalUser = {
  id: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type StripeErrorDetails = {
  type?: string;
  code?: string;
  param?: string;
  requestId?: string;
  message?: string;
};

export class BillingPortalError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(userMessage, options);
    this.name = "BillingPortalError";
  }
}

function getStripeErrorDetails(error: unknown): StripeErrorDetails {
  if (!error || typeof error !== "object") return {};

  const candidate = error as {
    type?: unknown;
    code?: unknown;
    param?: unknown;
    requestId?: unknown;
    message?: unknown;
  };

  return {
    type: typeof candidate.type === "string" ? candidate.type : undefined,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    param: typeof candidate.param === "string" ? candidate.param : undefined,
    requestId:
      typeof candidate.requestId === "string"
        ? candidate.requestId
        : undefined,
    message:
      typeof candidate.message === "string" ? candidate.message : undefined,
  };
}

function isMissingStripeResource(error: unknown, parameter: string) {
  const details = getStripeErrorDetails(error);
  return details.code === "resource_missing" && details.param === parameter;
}

function getPortalReturnUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    throw new BillingPortalError(
      "O endereço público da plataforma não está configurado. Contate o suporte.",
      "APP_URL_NOT_CONFIGURED",
    );
  }

  try {
    const appUrl = new URL(configuredUrl);
    if (appUrl.protocol !== "https:" && appUrl.protocol !== "http:") {
      throw new Error("Unsupported protocol");
    }

    return new URL("/dashboard/profissional", appUrl).toString();
  } catch (error) {
    throw new BillingPortalError(
      "O endereço público da plataforma está inválido. Contate o suporte.",
      "APP_URL_INVALID",
      { cause: error },
    );
  }
}

function portalConfigurationId() {
  return process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim() || null;
}

async function createStripePortalSession(customerId: string) {
  const configuration = portalConfigurationId();
  const params: Stripe.BillingPortal.SessionCreateParams = {
    customer: customerId,
    return_url: getPortalReturnUrl(),
    locale: "pt-BR",
  };

  if (configuration) params.configuration = configuration;

  return stripe.billingPortal.sessions.create(params);
}

async function recoverCustomerFromSubscription(user: BillingPortalUser) {
  if (!user.stripeSubscriptionId) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });

    return customerId;
  } catch (error) {
    if (isMissingStripeResource(error, "subscription")) return null;
    throw error;
  }
}

function billingPortalFailure(error: unknown) {
  const details = getStripeErrorDetails(error);
  const normalizedMessage = details.message?.toLowerCase() || "";

  if (
    normalizedMessage.includes("default configuration") ||
    normalizedMessage.includes("no configuration provided")
  ) {
    return new BillingPortalError(
      "O portal de cobrança da Stripe ainda não está ativado em produção. Contate o suporte.",
      "PORTAL_NOT_CONFIGURED",
      { cause: error },
    );
  }

  if (isMissingStripeResource(error, "configuration")) {
    return new BillingPortalError(
      "A configuração do portal de cobrança não pertence a este ambiente Stripe. Contate o suporte.",
      "PORTAL_CONFIGURATION_NOT_FOUND",
      { cause: error },
    );
  }

  if (isMissingStripeResource(error, "customer")) {
    return new BillingPortalError(
      "O vínculo desta assinatura não foi localizado na Stripe de produção. Contate o suporte.",
      "STRIPE_CUSTOMER_NOT_FOUND",
      { cause: error },
    );
  }

  return new BillingPortalError(
    "Não foi possível abrir o portal da Stripe agora. Tente novamente em alguns instantes.",
    "STRIPE_PORTAL_UNAVAILABLE",
    { cause: error },
  );
}

function logPortalFailure(userId: string, error: unknown) {
  const details = getStripeErrorDetails(error);
  console.error("stripe.billing_portal.session_failed", {
    userId,
    type: details.type,
    code: details.code,
    param: details.param,
    requestId: details.requestId,
    message: details.message,
  });
}

export async function createTechBillingPortalSession(user: BillingPortalUser) {
  if (!user.stripeCustomerId && !user.stripeSubscriptionId) {
    throw new BillingPortalError(
      "Nenhuma assinatura foi encontrada para gerenciamento.",
      "SUBSCRIPTION_NOT_LINKED",
    );
  }

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    try {
      customerId = await recoverCustomerFromSubscription(user);
    } catch (error) {
      logPortalFailure(user.id, error);
      throw billingPortalFailure(error);
    }
  }

  if (!customerId) {
    throw new BillingPortalError(
      "A assinatura está ativa, mas o vínculo com a Stripe precisa ser revisado pelo suporte.",
      "SUBSCRIPTION_LINK_INVALID",
    );
  }

  try {
    return await createStripePortalSession(customerId);
  } catch (firstError) {
    if (isMissingStripeResource(firstError, "customer")) {
      let recoveredCustomerId: string | null;

      try {
        recoveredCustomerId = await recoverCustomerFromSubscription(user);
      } catch (recoveryError) {
        logPortalFailure(user.id, recoveryError);
        throw billingPortalFailure(recoveryError);
      }

      if (recoveredCustomerId && recoveredCustomerId !== customerId) {
        try {
          return await createStripePortalSession(recoveredCustomerId);
        } catch (retryError) {
          logPortalFailure(user.id, retryError);
          throw billingPortalFailure(retryError);
        }
      }
    }

    logPortalFailure(user.id, firstError);
    throw billingPortalFailure(firstError);
  }
}
