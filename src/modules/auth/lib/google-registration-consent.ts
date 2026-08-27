import crypto from "crypto";

import { GENERAL_TERMS_VERSION, PRIVACY_POLICY_VERSION } from "@/modules/legal/terms-versions";

export const GOOGLE_REGISTRATION_COOKIE = "mwc_google_registration";
export const GOOGLE_AUTH_INTENT_COOKIE = "mwc_google_auth_intent";
const MAX_AGE_SECONDS = 10 * 60;

export type GoogleRegistrationConsent = {
  birthDate: string;
  generalTermsVersion: string;
  privacyPolicyVersion: string;
  issuedAt: number;
};

type GoogleAuthIntent = {
  callbackPath: string;
  issuedAt: number;
};

function secret() {
  return process.env.AUTH_SECRET || "";
}

function signature(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function createSignedValue(value: object) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function readSignedValue<T>(value?: string | null) {
  if (!value || !secret()) return null;

  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return null;

  const expectedSignature = signature(payload);
  if (receivedSignature.length !== expectedSignature.length) return null;
  if (
    !crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

function isRecent(issuedAt: unknown) {
  return (
    typeof issuedAt === "number" &&
    issuedAt <= Date.now() &&
    Date.now() - issuedAt <= MAX_AGE_SECONDS * 1000
  );
}

export function createGoogleRegistrationConsent(birthDate: string) {
  const consent: GoogleRegistrationConsent = {
    birthDate,
    generalTermsVersion: GENERAL_TERMS_VERSION,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    issuedAt: Date.now(),
  };
  return createSignedValue(consent);
}

export function readGoogleRegistrationConsent(value?: string | null) {
  const consent = readSignedValue<GoogleRegistrationConsent>(value);
  if (!consent || !isRecent(consent.issuedAt)) return null;
  if (
    typeof consent.birthDate !== "string" ||
    consent.generalTermsVersion !== GENERAL_TERMS_VERSION ||
    consent.privacyPolicyVersion !== PRIVACY_POLICY_VERSION
  ) {
    return null;
  }

  return consent;
}

export function createGoogleAuthIntent(callbackPath: string) {
  return createSignedValue({
    callbackPath,
    issuedAt: Date.now(),
  } satisfies GoogleAuthIntent);
}

export function readGoogleAuthIntent(value?: string | null) {
  const intent = readSignedValue<GoogleAuthIntent>(value);
  if (
    !intent ||
    !isRecent(intent.issuedAt) ||
    typeof intent.callbackPath !== "string" ||
    !intent.callbackPath.startsWith("/") ||
    intent.callbackPath.startsWith("//")
  ) {
    return null;
  }

  return intent;
}

export const GOOGLE_REGISTRATION_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
