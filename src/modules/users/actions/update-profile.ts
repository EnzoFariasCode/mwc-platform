"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { ActionResponse } from "@/modules/users/types/user-types";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeJsonArray(value: string | null, fieldName: string) {
  if (!value) return { ok: true, value: [] as unknown[] };
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: `${fieldName} inválido.` };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: `${fieldName} inválido.` };
  }
}

export async function updateProfile(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userInDb = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const updateData: any = {};

    if (formData.has("name")) {
      const name = formData.get("name") as string;
      if (!name || name.trim() === "") {
        return { success: false, error: "Nome é obrigatório." };
      }
      updateData.name = name;
    }

    if (formData.has("displayName")) {
      const displayName = formData.get("displayName") as string;
      updateData.displayName = displayName || null;
    }

    if (formData.has("birthDate")) {
      const birthDate = formData.get("birthDate") as string;
      updateData.birthDate = birthDate ? new Date(birthDate) : null;
    }

    if (formData.has("bio")) {
      const bio = formData.get("bio") as string;
      updateData.bio = bio || null;
    }

    if (formData.has("city")) {
      const city = formData.get("city") as string;
      updateData.city = city || null;
    }

    if (formData.has("state")) {
      const state = formData.get("state") as string;
      updateData.state = state || null;
    }

    if (formData.has("jobTitle")) {
      const jobTitle = formData.get("jobTitle") as string;
      updateData.jobTitle = jobTitle || null;
    }

    if (formData.has("hourlyRate")) {
      const hourlyRate = formData.get("hourlyRate") as string;
      updateData.hourlyRate = hourlyRate
        ? new Prisma.Decimal(hourlyRate)
        : null;
    }

    if (formData.has("yearsOfExperience")) {
      const yearsOfExperience = formData.get("yearsOfExperience") as string;
      updateData.yearsOfExperience = yearsOfExperience
        ? parseInt(yearsOfExperience)
        : null;
    }

    if (formData.has("socialGithub")) {
      const socialGithub = formData.get("socialGithub") as string;
      updateData.socialGithub = socialGithub || null;
    }

    if (formData.has("socialLinkedin")) {
      const socialLinkedin = formData.get("socialLinkedin") as string;
      updateData.socialLinkedin = socialLinkedin || null;
    }

    if (formData.has("skills")) {
      const skillsString = formData.get("skills") as string;
      const skillsParsed = safeJsonArray(skillsString, "skills");
      if (!skillsParsed.ok)
        return { success: false, error: skillsParsed.error };
      updateData.skills = skillsParsed.value;
    }

    if (formData.has("portfolio")) {
      const portfolioString = formData.get("portfolio") as string;
      const portfolioParsed = safeJsonArray(portfolioString, "portfolio");
      if (!portfolioParsed.ok)
        return { success: false, error: portfolioParsed.error };
      updateData.portfolio = portfolioParsed.value;
    }

    if (formData.has("certificates")) {
      const certificatesString = formData.get("certificates") as string;
      const certificatesParsed = safeJsonArray(certificatesString, "certificates");
      if (!certificatesParsed.ok)
        return { success: false, error: certificatesParsed.error };
      updateData.certificates = certificatesParsed.value;
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    const profileImage = formData.get("profileImage") as File | null;

    const isProfessional = userInDb.userType === "PROFESSIONAL";
    if (!isProfessional) {
      delete updateData.jobTitle;
      delete updateData.hourlyRate;
      delete updateData.yearsOfExperience;
      delete updateData.skills;
      delete updateData.portfolio;
      delete updateData.certificates;
    }

    if (profileImage && profileImage.size > 0) {
      if (profileImage.size > MAX_PROFILE_IMAGE_BYTES) {
        return {
          success: false,
          error: "Imagem muito grande. Limite de 2MB.",
        };
      }

      if (!ALLOWED_IMAGE_TYPES.has(profileImage.type)) {
        return {
          success: false,
          error: "Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.",
        };
      }

      const arrayBuffer = await profileImage.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_PROFILE_IMAGE_BYTES) {
        return {
          success: false,
          error: "Imagem muito grande. Limite de 2MB.",
        };
      }
      const buffer = Buffer.from(arrayBuffer);

      updateData.profileImageBytes = buffer;
      updateData.profileImageType = profileImage.type;
    }

    if (newPassword && newPassword.trim() !== "") {
      if (!currentPassword) {
        return { success: false, error: "Informe a senha atual para alterar." };
      }

      if (!userInDb.password) {
        return {
          success: false,
          error: "Conta sem senha cadastrada. Use login social.",
        };
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        userInDb.password
      );

      if (!isPasswordValid) {
        return { success: false, error: "Senha atual incorreta." };
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.password = passwordHash;
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/dashboard/perfil");
    revalidatePath("/dashboard/cliente");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return {
      success: false,
      error: "Erro interno ao atualizar perfil.",
    };
  }
}
