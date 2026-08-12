"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { COOKIE_POLICY_VERSION } from "@/modules/legal/terms-versions";

export async function recordCookieConsent(input: {
  consentId: string;
  functionality: boolean;
  analytics: boolean;
  marketing: boolean;
  action: "ACCEPT_ALL" | "REJECT_NON_ESSENTIAL" | "SAVE_PREFERENCES";
}) {
  if (!input.consentId || input.consentId.length > 100) return { success: false };

  try {
    const session = await auth();
    const requestHeaders = await headers();

    if (!db.cookieConsentEvent) {
      console.warn(
        "[COOKIE_CONSENT_NOT_READY] Prisma Client precisa ser regenerado e o servidor reiniciado.",
      );
      return { success: false };
    }

    await db.cookieConsentEvent.create({
      data: {
        consentId: input.consentId,
        userId: session?.user?.id || null,
        policyVersion: COOKIE_POLICY_VERSION,
        necessary: true,
        functionality: input.functionality === true,
        analytics: false,
        marketing: false,
        action: input.action,
        ipAddress:
          requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          requestHeaders.get("x-real-ip") ||
          "unknown",
        userAgent: requestHeaders.get("user-agent") || undefined,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[COOKIE_CONSENT_RECORD_ERROR]", error);
    return { success: false };
  }
}
