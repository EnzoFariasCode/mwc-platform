// src/actions/auth/login-user.ts
"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { findUserByEmail } from "@/services/user-service";
import { ActionResponse } from "@/types/user-types";
import { SignJWT } from "jose"; // <--- Importamos a lib de assinatura

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

    // --- AQUI COMEÇA A MÁGICA DA SEGURANÇA (JWT) ---

    // 1. Prepara a chave secreta
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    // 2. Cria o token assinado
    // "sub" (subject) é o padrão para guardar o ID do usuário
    const token = await new SignJWT({ sub: user.id, role: user.userType })
      .setProtectedHeader({ alg: "HS256" }) // Algoritmo de criptografia
      .setIssuedAt()
      .setExpirationTime("7d") // Expira em 7 dias
      .sign(secret); // Assina com sua senha mestra

    // 3. Salva o TOKEN (não o ID) no cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      // Mudei o nome para 'session'
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro interno no servidor." };
  }
}
