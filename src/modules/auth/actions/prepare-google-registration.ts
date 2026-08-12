"use server";

import { cookies } from "next/headers";
import {
  createGoogleRegistrationConsent,
  GOOGLE_REGISTRATION_COOKIE,
  GOOGLE_REGISTRATION_COOKIE_MAX_AGE,
} from "@/modules/auth/lib/google-registration-consent";

export async function prepareGoogleRegistration(input: {
  birthDate: string;
  generalTermsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}) {
  if (!input.generalTermsAccepted || !input.privacyPolicyAccepted) {
    return { success: false, error: "Confirme os Termos Gerais e a leitura da Politica de Privacidade." };
  }
  const birthDate = new Date(`${input.birthDate}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return { success: false, error: "Informe uma data de nascimento valida." };
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1;
  if (age < 18) return { success: false, error: "A plataforma e exclusiva para maiores de 18 anos." };

  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_REGISTRATION_COOKIE, createGoogleRegistrationConsent(input.birthDate), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_REGISTRATION_COOKIE_MAX_AGE,
  });
  return { success: true };
}
