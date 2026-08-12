import { COOKIE_POLICY_VERSION } from "@/modules/legal/terms-versions";

export const COOKIE_CONSENT_COOKIE = "mwc_cookie_consent";
export const COOKIE_CONSENT_EVENT = "mwc:manage-cookie-consent";
export const COOKIE_CONSENT_MAX_AGE = 180 * 24 * 60 * 60;

export type CookiePreferences = {
  necessary: true;
  functionality: boolean;
  analytics: false;
  marketing: false;
};

export type StoredCookieConsent = CookiePreferences & {
  consentId: string;
  policyVersion: string;
  savedAt: string;
};

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  functionality: false,
  analytics: false,
  marketing: false,
};

export function readStoredCookieConsent(): StoredCookieConsent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE_CONSENT_COOKIE}=`))?.split("=").slice(1).join("=");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as StoredCookieConsent;
    if (parsed.policyVersion !== COOKIE_POLICY_VERSION || parsed.necessary !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSensitiveOnlineRoute(pathname: string) {
  return pathname.startsWith("/agendar-consulta") || pathname.startsWith("/checkout-saude");
}

export function hasFunctionalConsent() {
  return readStoredCookieConsent()?.functionality === true;
}
