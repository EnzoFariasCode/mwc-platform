"use server";

import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";
import { findUserByEmail, createUser } from "@/services/user-service";
import { ActionResponse } from "@/types/user-types";

export async function registerUser(
  formData: FormData,
): Promise<ActionResponse> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("displayName")?.toString().trim();
  const birthDateRaw = formData.get("birthDate")?.toString();
  const isPro = formData.get("isPro") === "on";

  // Dados profissionais
  const jobTitle = formData.get("jobTitle")?.toString().trim();
  const experienceRaw = formData.get("experienceLevel")?.toString();

  // 1. Validação Básica
  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  // 2. Validação Profissional
  if (isPro && !jobTitle) {
    return {
      success: false,
      error: "Profissionais precisam informar sua especialidade.",
    };
  }

  // --- 3. VALIDAÇÃO DE SENHA (NOVA) ---
  // Regras: 8-20 caracteres, Maiúscula, Minúscula, Número ou Símbolo
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,20}$/;

  if (!passwordRegex.test(password)) {
    return {
      success: false,
      error:
        "A senha deve ter entre 8 e 20 caracteres, incluir letra maiúscula, minúscula e número/símbolo.",
    };
  }
  // ------------------------------------

  try {
    const userExists = await findUserByEmail(email);

    if (userExists) {
      return { success: false, error: "Este email já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
    const yearsOfExperience = experienceRaw ? parseInt(experienceRaw) : null;

    await createUser({
      name,
      email,
      password: hashedPassword,
      displayName: displayName || name,
      birthDate,
      userType: isPro ? UserType.PROFESSIONAL : UserType.CLIENT,
      jobTitle: isPro ? jobTitle : null,
      yearsOfExperience: isPro ? yearsOfExperience : null,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { success: false, error: "Erro ao criar conta." };
  }
}
