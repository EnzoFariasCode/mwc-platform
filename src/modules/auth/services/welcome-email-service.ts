import "server-only";

import { sendEmail } from "@/modules/email/email-client";
import { welcomeEmail } from "@/modules/email/templates/auth-emails";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br";

export async function sendWelcomeEmail({
  email,
  name,
  userType,
  industry,
}: {
  email: string | null;
  name: string | null;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry: "TECH" | "HEALTH";
}) {
  const template = welcomeEmail({
    name,
    userType,
    industry,
    appUrl,
  });

  const result = await sendEmail({
    to: email,
    ...template,
    logPrefix: "WELCOME_EMAIL",
  });

  if (!result.success) {
    console.error("[WELCOME_EMAIL_ERROR]", result.error);
  }
}
