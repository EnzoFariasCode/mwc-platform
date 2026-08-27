import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGoogleAuthIntent,
  createGoogleRegistrationConsent,
  readGoogleAuthIntent,
  readGoogleRegistrationConsent,
} from "./google-registration-consent";

describe("Google registration consent", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret-with-enough-entropy");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("le apenas um aceite assinado e dentro da validade", () => {
    const value = createGoogleRegistrationConsent("1990-05-20");

    expect(readGoogleRegistrationConsent(value)?.birthDate).toBe(
      "1990-05-20",
    );
    expect(readGoogleRegistrationConsent(`${value}alterado`)).toBeNull();

    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(readGoogleRegistrationConsent(value)).toBeNull();
  });

  it("preserva somente uma intencao de retorno local", () => {
    const onlineIntent = createGoogleAuthIntent(
      "/checkout-saude?professionalId=abc",
    );
    const externalIntent = createGoogleAuthIntent("//example.com/phishing");

    expect(readGoogleAuthIntent(onlineIntent)?.callbackPath).toBe(
      "/checkout-saude?professionalId=abc",
    );
    expect(readGoogleAuthIntent(externalIntent)).toBeNull();
  });
});
