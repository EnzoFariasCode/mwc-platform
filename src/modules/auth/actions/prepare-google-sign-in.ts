"use server";

import { cookies } from "next/headers";

import { getSafeLocalCallbackPath } from "@/modules/auth/lib/account-access";
import {
  createGoogleAuthIntent,
  GOOGLE_AUTH_INTENT_COOKIE,
  GOOGLE_REGISTRATION_COOKIE,
  GOOGLE_REGISTRATION_COOKIE_MAX_AGE,
} from "@/modules/auth/lib/google-registration-consent";

export async function prepareGoogleSignIn(callbackUrl?: string) {
  const callbackPath = getSafeLocalCallbackPath(callbackUrl) ?? "/portal";
  const cookieStore = await cookies();

  // Um login comum nao pode reaproveitar acidentalmente o aceite preparado
  // para outra conta Google em uma tentativa de cadastro anterior.
  cookieStore.delete(GOOGLE_REGISTRATION_COOKIE);
  cookieStore.set(
    GOOGLE_AUTH_INTENT_COOKIE,
    createGoogleAuthIntent(callbackPath),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GOOGLE_REGISTRATION_COOKIE_MAX_AGE,
    },
  );

  return { success: true } as const;
}
