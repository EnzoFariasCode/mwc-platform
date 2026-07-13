import { describe, expect, it } from "vitest";

import {
  CUSTOMER_PAYMENT_METHODS,
  ONE_TIME_PAYMENT_METHODS,
  SUBSCRIPTION_PAYMENT_METHODS,
  evaluatePaymentMethodConfiguration,
} from "./payment-methods";

const baseConfiguration = {
  id: "pmc_test",
  active: true,
  isDefault: true,
  livemode: true,
  available: { card: true, pix: false },
};

describe("configuracao de metodos Stripe", () => {
  it("usa somente cartao em pagamentos e assinaturas", () => {
    expect(ONE_TIME_PAYMENT_METHODS).toEqual(["card"]);
    expect(SUBSCRIPTION_PAYMENT_METHODS).toEqual(["card"]);
    expect(CUSTOMER_PAYMENT_METHODS.map((method) => method.id)).toEqual([
      "card",
    ]);
  });

  it("considera saudavel a configuracao live com cartao disponivel", () => {
    const result = evaluatePaymentMethodConfiguration({
      configuration: baseConfiguration,
      requireLiveMode: true,
    });

    expect(result.healthy).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("detecta cartao indisponivel", () => {
    const result = evaluatePaymentMethodConfiguration({
      configuration: {
        ...baseConfiguration,
        available: { card: false, pix: true },
      },
      requireLiveMode: true,
    });

    expect(result.healthy).toBe(false);
    expect(result.issues).toContain(
      "O metodo card nao esta disponivel na Stripe.",
    );
    expect(result.advertisedMethods).toEqual(["card"]);
  });

  it("detecta configuracao de teste em producao", () => {
    const result = evaluatePaymentMethodConfiguration({
      configuration: { ...baseConfiguration, livemode: false },
      requireLiveMode: true,
    });

    expect(result.healthy).toBe(false);
  });
});
