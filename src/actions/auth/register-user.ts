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

  // [NOVO] Captura os dados profissionais
  const jobTitle = formData.get("jobTitle")?.toString().trim();
  const experienceRaw = formData.get("experienceLevel")?.toString();

  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  // [NOVO] Validação extra para profissionais
  if (isPro && !jobTitle) {
    return {
      success: false,
      error: "Profissionais precisam informar sua especialidade.",
    };
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

    // [NOVO] Converte a experiência para número (se existir)
    const yearsOfExperience = experienceRaw ? parseInt(experienceRaw) : null;

    // 3. Cria via Service
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
