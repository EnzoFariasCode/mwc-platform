"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { getRateLimitKeys, rateLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/modules/auth/lib/password";
import { sendEmail } from "@/modules/email/email-client";
import { resetPasswordEmail } from "@/modules/email/templates/auth-emails";

const RESET_TTL_MINUTES = 15;
const RESET_REQUEST_LIMIT_EMAIL = 3;
const RESET_REQUEST_LIMIT_IP = 5;
const RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;

const RESET_VERIFY_LIMIT_EMAIL = 5;
const RESET_VERIFY_LIMIT_IP = 10;
const RESET_VERIFY_WINDOW_MS = 15 * 60 * 1000;

function hashResetCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function requestResetCode(email: string): Promise<ActionResponse> {
  try {
    const [ipKey, emailKey] = await getRateLimitKeys("reset-request", email);
    const ipLimit = await rateLimit(
      ipKey,
      RESET_REQUEST_LIMIT_IP,
      RESET_REQUEST_WINDOW_MS,
    );
    const emailLimit = await rateLimit(
      emailKey,
      RESET_REQUEST_LIMIT_EMAIL,
      RESET_REQUEST_WINDOW_MS,
    );

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return { success: true };
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashResetCode(code);
    const expiry = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { resetCode: codeHash, resetCodeExpiry: expiry },
    });

    if (process.env.ENABLE_DEV_TOOLS === "true") {
      console.log(`RESET CODE FOR ${email}: ${code}`);
    }

    const resetEmail = resetPasswordEmail(code);
    const result = await sendEmail({
      to: email,
      ...resetEmail,
      logPrefix: "PASSWORD_RESET_EMAIL",
      failWhenMissingConfig: process.env.NODE_ENV === "production",
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erro ao enviar e-mail. Tente novamente.",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<ActionResponse> {
  try {
    const [ipKey, emailKey] = await getRateLimitKeys("reset-verify", email);
    const ipLimit = await rateLimit(
      ipKey,
      RESET_VERIFY_LIMIT_IP,
      RESET_VERIFY_WINDOW_MS,
    );
    const emailLimit = await rateLimit(
      emailKey,
      RESET_VERIFY_LIMIT_EMAIL,
      RESET_VERIFY_WINDOW_MS,
    );

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return {
        success: false,
        error: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    }

    const user = await db.user.findUnique({ where: { email } });
    const codeHash = hashResetCode(code);

    if (
      !user ||
      !user.resetCode ||
      user.resetCode !== codeHash ||
      !user.resetCodeExpiry ||
      new Date() > user.resetCodeExpiry
    ) {
      return { success: false, error: "Codigo invalido ou expirado." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Erro ao verificar codigo." };
  }
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<ActionResponse> {
  try {
    const [ipKey, emailKey] = await getRateLimitKeys("reset-verify", email);
    const ipLimit = await rateLimit(
      ipKey,
      RESET_VERIFY_LIMIT_IP,
      RESET_VERIFY_WINDOW_MS,
    );
    const emailLimit = await rateLimit(
      emailKey,
      RESET_VERIFY_LIMIT_EMAIL,
      RESET_VERIFY_WINDOW_MS,
    );

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return {
        success: false,
        error: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Operacao invalida." };

    const codeHash = hashResetCode(code);

    if (
      !user.resetCode ||
      user.resetCode !== codeHash ||
      !user.resetCodeExpiry ||
      new Date() > user.resetCodeExpiry
    ) {
      return { success: false, error: "Codigo invalido ou expirado." };
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error || "A senha nao atende aos requisitos.",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar senha." };
  }
}
