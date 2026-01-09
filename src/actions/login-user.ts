"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export async function loginUser(formData: FormData) {
  // 1. Validação com Zod (segurança contra formatos incorretos)
  const validation = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  try {
    // 2. Buscar usuário no banco
    const user = await db.user.findUnique({
      where: { email },
    });

    // 3. Verificar credenciais (Hash)
    // Se usuário não existe OU senha não bate, retorna erro genérico por segurança
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Email ou senha incorretos." };
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
    return { error: "Erro interno no servidor. Tente novamente." };
  }
}
