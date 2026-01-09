// src/actions/auth/register-user.ts
"use server";

import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";
import { findUserByEmail, createUser } from "@/services/user-service"; // <--- Service
import { ActionResponse } from "@/types/user-types"; // <--- Tipagem Padrão

export async function registerUser(
  formData: FormData
): Promise<ActionResponse> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("displayName")?.toString().trim();
  const birthDateRaw = formData.get("birthDate")?.toString();
  const isPro = formData.get("isPro") === "on";

  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  try {
    // 1. Verifica existência via Service
    const userExists = await findUserByEmail(email);

    if (userExists) {
      return { success: false, error: "Este email já está em uso." };
    }

    // 2. Prepara dados
    const hashedPassword = await bcrypt.hash(password, 10);
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;

    // 3. Cria via Service
    await createUser({
      name,
      email,
      password: hashedPassword,
      displayName: displayName || name,
      birthDate,
      userType: isPro ? UserType.PROFESSIONAL : UserType.CLIENT,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { success: false, error: "Erro ao criar conta." };
  }
}
