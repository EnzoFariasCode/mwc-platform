// src/actions/auth/login-user.ts
"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { findUserByEmail } from "@/services/user-service"; // <--- Importando o Service
import { ActionResponse } from "@/types/user-types"; // <--- Importando a Tipagem Padrão

const LoginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

// Mudamos o retorno para Promise<ActionResponse>
export async function loginUser(formData: FormData): Promise<ActionResponse> {
  // 1. Validação Zod
  const validation = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  try {
    // 2. Busca via Service (Sem db.user direto aqui)
    const user = await findUserByEmail(email);

    // 3. Verificar credenciais
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { success: false, error: "Email ou senha incorretos." };
    }

    // 4. Criar Sessão
    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro interno no servidor." };
  }
}
