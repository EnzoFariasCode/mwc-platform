import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
const configuredPortalId =
  process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

if (!secretKey?.startsWith("sk_live_")) {
  console.error(
    "STRIPE_SECRET_KEY de producao nao esta disponivel neste ambiente.",
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey);

try {
  const configurations = await stripe.billingPortal.configurations.list({
    limit: 100,
  });
  const configuration = configuredPortalId
    ? await stripe.billingPortal.configurations.retrieve(configuredPortalId)
    : configurations.data.find((item) => item.is_default);

  if (!configuration) {
    console.error(
      "Nenhuma configuracao padrao do Customer Portal foi encontrada no modo producao.",
    );
    console.error(
      "Ative e salve o portal em Stripe Dashboard > Settings > Billing > Customer portal.",
    );
    process.exit(1);
  }

  if (!configuration.active || !configuration.livemode) {
    console.error(
      "A configuracao selecionada nao esta ativa no modo producao.",
    );
    process.exit(1);
  }

  const features = configuration.features;
  const checks = {
    paymentMethodUpdate: features.payment_method_update.enabled,
    subscriptionCancel: features.subscription_cancel.enabled,
    subscriptionUpdate: features.subscription_update.enabled,
    invoiceHistory: features.invoice_history.enabled,
  };

  console.log("Customer Portal Stripe ativo em producao.");
  console.log(
    `Configuracao: ${configuration.is_default ? "padrao" : "explicita"}`,
  );
  console.log(`Atualizar pagamento: ${checks.paymentMethodUpdate ? "sim" : "nao"}`);
  console.log(`Cancelar assinatura: ${checks.subscriptionCancel ? "sim" : "nao"}`);
  console.log(`Trocar plano: ${checks.subscriptionUpdate ? "sim" : "nao"}`);
  console.log(`Historico de faturas: ${checks.invoiceHistory ? "sim" : "nao"}`);

  if (!checks.paymentMethodUpdate || !checks.subscriptionCancel) {
    console.error(
      "O portal abre, mas nao permite todas as operacoes prometidas pela plataforma.",
    );
    process.exit(1);
  }
} catch (error) {
  const details = error && typeof error === "object" ? error : {};
  console.error("Falha ao verificar o Customer Portal da Stripe.");
  console.error(
    JSON.stringify({
      type: "type" in details ? details.type : undefined,
      code: "code" in details ? details.code : undefined,
      param: "param" in details ? details.param : undefined,
      message: "message" in details ? details.message : undefined,
    }),
  );
  process.exit(1);
}
