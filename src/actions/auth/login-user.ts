"use server";

import { z } from "zod";
import { ActionResponse } from "@/types/user-types";
import { signIn } from "@/auth";

const LoginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export async function loginUser(formData: FormData): Promise<ActionResponse> {
  const validation = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  try {
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
