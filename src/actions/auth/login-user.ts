"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { findUserByEmail } from "@/services/user-service";
import { ActionResponse } from "@/types/user-types";
import { createSession } from "@/lib/auth"; // <--- USAMOS A FUNÇÃO CENTRALIZADA

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
    const user = await findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { success: false, error: "Email ou senha incorretos." };
    }

    // --- MUDANÇA AQUI ---
    // Em vez de criar o cookie na mão, chamamos a função que configuramos
    // para ser "Session Cookie" (apaga ao fechar o navegador).
    await createSession(user.id);

    return { success: true };
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro interno no servidor." };
  }
}
