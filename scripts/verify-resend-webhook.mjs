import { Resend } from "resend";

const REQUIRED_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.failed",
  "email.suppressed",
];

const apiKey = process.env.RESEND_API_KEY;
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!apiKey || !apiKey.startsWith("re_")) {
  console.error("RESEND_API_KEY real nao configurada neste ambiente.");
  process.exitCode = 1;
} else if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
  console.error("RESEND_WEBHOOK_SECRET real nao configurado neste ambiente.");
  process.exitCode = 1;
} else if (!appUrl) {
  console.error("NEXT_PUBLIC_APP_URL nao configurada neste ambiente.");
  process.exitCode = 1;
} else {
  const endpoint = new URL("/api/webhooks/resend", new URL(appUrl).origin).toString();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.webhooks.list({ limit: 100 });

  if (error) {
    console.error("Nao foi possivel consultar os webhooks do Resend:", error.message);
    process.exitCode = 1;
  } else {
    const webhook = data?.data.find((item) => item.endpoint === endpoint);
    if (!webhook) {
      console.error(`Webhook nao encontrado: ${endpoint}`);
      process.exitCode = 1;
    } else {
      const missingEvents = REQUIRED_EVENTS.filter(
        (event) => !webhook.events?.includes(event),
      );
      console.log("Endpoint:", webhook.endpoint);
      console.log("Status:", webhook.status);
      console.log("Eventos obrigatorios:", missingEvents.length ? `faltando ${missingEvents.join(", ")}` : "OK");
      console.log("Segredo local:", "configurado (valor protegido)");

      if (webhook.status !== "enabled" || missingEvents.length > 0) {
        process.exitCode = 1;
      }
    }
  }
}
