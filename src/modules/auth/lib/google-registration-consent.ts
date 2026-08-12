import crypto from "crypto";

import { GENERAL_TERMS_VERSION, PRIVACY_POLICY_VERSION } from "@/modules/legal/terms-versions";

export const GOOGLE_REGISTRATION_COOKIE = "mwc_google_registration";
const MAX_AGE_SECONDS = 10 * 60;

type GoogleRegistrationConsent = {
  birthDate: string;
  generalTermsVersion: string;
  privacyPolicyVersion: string;
  issuedAt: number;
};

function secret() {
  return process.env.AUTH_SECRET || "";
}

function signature(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createGoogleRegistrationConsent(birthDate: string) {
  const consent: GoogleRegistrationConsent = {
    birthDate,
    generalTermsVersion: GENERAL_TERMS_VERSION,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    issuedAt: Date.now(),
  };
  const payload = Buffer.from(JSON.stringify(consent)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readGoogleRegistrationConsent(value?: string | null) {
  if (!value || !secret()) return null;
  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return null;
  const expected = signature(payload);
  if (receivedSignature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expected))) return null;
  try {
    const consent = JSON.parse(Buffer.from(payload, "base64url").toString()) as GoogleRegistrationConsent;
    if (Date.now() - consent.issuedAt > MAX_AGE_SECONDS * 1000) return null;
    if (consent.generalTermsVersion !== GENERAL_TERMS_VERSION || consent.privacyPolicyVersion !== PRIVACY_POLICY_VERSION) return null;
    return consent;
  } catch {
    return null;
  }
}

export const GOOGLE_REGISTRATION_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
