"use server";

import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType, Industry } from "@prisma/client"; // Adicionado Industry aqui
import { findUserByEmail } from "@/modules/users/services/user-service";
import { ActionResponse } from "@/modules/users/types/user-types";
import { validatePassword } from "@/modules/auth/lib/password";
import { sendWelcomeEmail } from "@/modules/auth/services/welcome-email-service";
import {
  GENERAL_TERMS_VERSION,
  getProfessionalTerms,
  type ProfessionalTermsIndustry,
} from "@/modules/legal/terms-versions";
import { getOnlineSpecialtyByJobTitle } from "@/modules/health/lib/specialties";

export async function registerUser(
  formData: FormData,
): Promise<ActionResponse> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("displayName")?.toString().trim();
  const birthDateRaw = formData.get("birthDate")?.toString();
  const isPro = formData.get("isPro") === "on";
  const acceptedGeneralTerms = formData.get("generalTermsAccepted") === "on";
  const acceptedProfessionalTerms =
    formData.get("professionalTermsAccepted") === "on";

  // Dados profissionais
  const jobTitle = formData.get("jobTitle")?.toString().trim();
  const experienceRaw = formData.get("experienceLevel")?.toString();
  const industryRaw = formData.get("industry")?.toString(); // Extraindo o novo campo
  const onlineSpecialty =
    isPro && industryRaw === Industry.HEALTH && jobTitle
      ? getOnlineSpecialtyByJobTitle(jobTitle)
      : null;

  // 1. Validacao basica
  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos obrigatorios." };
  }

  if (!acceptedGeneralTerms) {
    return {
      success: false,
      error: "Aceite os Termos Gerais e a Politica de Privacidade.",
    };
  }

  // 2. Validacao profissional
  if (isPro) {
    if (!jobTitle) {
      return {
        success: false,
        error: "Profissionais precisam informar sua especialidade.",
      };
    }
    if (industryRaw !== Industry.TECH && industryRaw !== Industry.HEALTH) {
      return {
        success: false,
        error: "Profissionais precisam selecionar um setor valido.",
      };
    }
    if (industryRaw === Industry.HEALTH && !onlineSpecialty) {
      return {
        success: false,
        error: "Selecione uma categoria valida do MWC Online.",
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
      return { success: false, error: "Este email ja esta em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
    const yearsOfExperience = experienceRaw ? parseInt(experienceRaw) : null;

    const acceptedIndustry = isPro
      ? (industryRaw as ProfessionalTermsIndustry)
      : null;
    const industry = acceptedIndustry ?? Industry.TECH;
    const sectorTerms = acceptedIndustry
      ? getProfessionalTerms(acceptedIndustry)
      : null;
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          displayName: displayName || name,
          birthDate,
          userType: isPro ? UserType.PROFESSIONAL : UserType.CLIENT,
          industry,
          jobTitle: isPro ? jobTitle : null,
          onlineSpecialty: onlineSpecialty?.code ?? null,
          yearsOfExperience: isPro ? yearsOfExperience : null,
        },
      });

      await tx.termsAcceptance.create({
        data: {
          userId: createdUser.id,
          ipAddress,
          userAgent,
          generalTermsVersion: GENERAL_TERMS_VERSION,
          industry: acceptedIndustry,
          sectorTermsVersion: sectorTerms?.version,
        },
      });

      return createdUser;
    });

    await sendWelcomeEmail({
      email: user.email,
      name: user.name,
      userType: user.userType,
      industry: user.industry,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuario:", error);
    return { success: false, error: "Erro ao criar conta." };
  }
}
