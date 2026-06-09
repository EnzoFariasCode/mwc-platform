"use server";

import { headers } from "next/headers";
import { db } from "@/lib/prisma";
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
  const acceptedProfessionalTerms =
    formData.get("professionalTermsAccepted") === "on";

  // Dados profissionais
  const jobTitle = formData.get("jobTitle")?.toString().trim();
  const experienceRaw = formData.get("experienceLevel")?.toString();
  const industryRaw = formData.get("industry")?.toString(); // Extraindo o novo campo

  // 1. ValidaÃ§Ã£o BÃ¡sica
  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatÃ³rios." };
  }

  // 2. ValidaÃ§Ã£o Profissional
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
        error: "Profissionais precisam selecionar a Ã¡rea de atuaÃ§Ã£o.",
      };
    }
    if (!acceptedProfessionalTerms) {
      return {
        success: false,
        error: "Profissionais precisam aceitar os termos profissionais.",
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
      return { success: false, error: "Este email jÃ¡ estÃ¡ em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
    const yearsOfExperience = experienceRaw ? parseInt(experienceRaw) : null;

    // Define o setor: Se for PRO e marcou HEALTH, salva HEALTH. O resto vira TECH.
    const industry =
      isPro && industryRaw === "HEALTH" ? Industry.HEALTH : Industry.TECH;

    const user = await createUser({
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


    if (isPro) {
      const headersList = await headers();
      const ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "unknown";
      const userAgent = headersList.get("user-agent") || undefined;

      await db.professionalTermsAcceptance.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          termsVersion: "professional-v1.0",
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuÃ¡rio:", error);
    return { success: false, error: "Erro ao criar conta." };
  }
}
