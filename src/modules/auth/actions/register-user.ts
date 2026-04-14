"use server";

import bcrypt from "bcryptjs";
import { UserType, Industry } from "@prisma/client"; // Adicionado Industry aqui
import {
  findUserByEmail,
  createUser,
} from "@/modules/users/services/user-service";
import { ActionResponse } from "@/modules/users/types/user-types";
import { validatePassword } from "@/modules/auth/lib/password";

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
  const industryRaw = formData.get("industry")?.toString(); // Extraindo o novo campo

  // 1. Validação Básica
  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  // 2. Validação Profissional
  if (isPro) {
    if (!jobTitle) {
      return {
        success: false,
        error: "Profissionais precisam informar sua especialidade.",
      };
    }
    if (!industryRaw) {
      return {
        success: false,
        error: "Profissionais precisam selecionar a área de atuação.",
      };
    }
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  try {
    const userExists = await findUserByEmail(email);

    if (userExists) {
      return { success: false, error: "Este email já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
    const yearsOfExperience = experienceRaw ? parseInt(experienceRaw) : null;

    // Define o setor: Se for PRO e marcou HEALTH, salva HEALTH. O resto vira TECH.
    const industry =
      isPro && industryRaw === "HEALTH" ? Industry.HEALTH : Industry.TECH;

    await createUser({
      name,
      email,
      password: hashedPassword,
      displayName: displayName || name,
      birthDate,
      userType: isPro ? UserType.PROFESSIONAL : UserType.CLIENT,
      industry, // Enviando o campo para o banco
      jobTitle: isPro ? jobTitle : null,
      yearsOfExperience: isPro ? yearsOfExperience : null,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { success: false, error: "Erro ao criar conta." };
  }
}
