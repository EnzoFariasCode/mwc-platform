import Stripe from "stripe";

// Garantia de segurança para o servidor não iniciar sem a chave
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY está faltando no arquivo .env");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Mantendo exatamente a mesma versão que você já configurou no seu webhook
  apiVersion: "2026-01-28.clover" as any,
  typescript: true,
  appInfo: {
    name: "MWC Platform",
    version: "0.1.0",
  },
});
