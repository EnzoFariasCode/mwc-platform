import "dotenv/config";
import Stripe from "stripe";

const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "charge.refunded",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.funds_reinstated",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!secretKey || !secretKey.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY real nao configurada neste ambiente.");
  process.exit(1);
}

if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
  console.error("STRIPE_WEBHOOK_SECRET real nao configurado neste ambiente.");
  process.exit(1);
}

if (!appUrl) {
  console.error("NEXT_PUBLIC_APP_URL nao configurada neste ambiente.");
  process.exit(1);
}

const expectedUrl = new URL("/api/webhooks/stripe", appUrl).toString();
const stripe = new Stripe(secretKey, {
  apiVersion: "2026-01-28.clover",
});
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
const endpoint = endpoints.data.find(
  (candidate) =>
    candidate.url.replace(/\/$/, "") === expectedUrl.replace(/\/$/, ""),
);

if (!endpoint) {
  console.error(`Endpoint Stripe nao encontrado: ${expectedUrl}`);
  process.exit(1);
}

const receivesAllEvents = endpoint.enabled_events.includes("*");
const missingEvents = receivesAllEvents
  ? []
  : REQUIRED_EVENTS.filter(
      (eventName) => !endpoint.enabled_events.includes(eventName),
    );

console.log(`Endpoint: ${endpoint.url}`);
console.log(`Status: ${endpoint.status}`);
console.log(`Eventos obrigatorios: ${REQUIRED_EVENTS.length}`);
console.log(`Eventos ausentes: ${missingEvents.length}`);

if (endpoint.status !== "enabled" || missingEvents.length > 0) {
  if (missingEvents.length > 0) {
    console.error(missingEvents.map((eventName) => `- ${eventName}`).join("\n"));
  }
  process.exit(1);
}

console.log("Configuracao do webhook Stripe valida.");
