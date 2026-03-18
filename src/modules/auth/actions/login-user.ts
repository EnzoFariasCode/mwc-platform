"use server";

import { z } from "zod";
import { ActionResponse } from "@/modules/users/types/user-types";
import { signIn } from "@/auth";
import { getRateLimitKeys, rateLimit } from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().email("Formato de email invalido"),
  password: z.string().min(1, "A senha e obrigatoria"),
});

const LOGIN_LIMIT_EMAIL = 5;
const LOGIN_LIMIT_IP = 15;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export async function loginUser(formData: FormData): Promise<ActionResponse> {
  const validation = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  try {
    const [ipKey, emailKey] = await getRateLimitKeys("login", email);
    const ipLimit = await rateLimit(ipKey, LOGIN_LIMIT_IP, LOGIN_WINDOW_MS);
    const emailLimit = await rateLimit(
      emailKey,
      LOGIN_LIMIT_EMAIL,
      LOGIN_WINDOW_MS
    );

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return {
        success: false,
        error: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result && "error" in result && result.error) {
      return { success: false, error: "Email ou senha incorretos." };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro interno no servidor." };
  }
}
