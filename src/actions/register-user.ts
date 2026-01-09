"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";

// 1. Definimos a tipagem do que essa função devolve
export type RegisterResponse = {
  success?: boolean;
  error?: string;
};

// 2. Aplicamos a tipagem na Promise
export async function registerUser(
  formData: FormData
): Promise<RegisterResponse> {
  // Campos vindos do formulário
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("displayName")?.toString().trim();
  const birthDateRaw = formData.get("birthDate")?.toString();

  // Checkbox: profissional? (Se marcado, vem "on")
  const isPro = formData.get("isPro") === "on";

  // Validação básica
  if (!name || !email || !password) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    // Verifica se email já existe
    const userExists = await db.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return { error: "Este email já está em uso." };
    }

    // Criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Converte data
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;

    // Cria usuário
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        displayName: displayName || name,
        birthDate,

        // 🔥 Lógica do UserType baseada no checkbox
        userType: isPro ? UserType.PROFESSIONAL : UserType.CLIENT,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { error: "Erro ao criar conta. Tente novamente." };
  }
}
