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

    const name = formData.get("name") as string;
    const displayName = formData.get("displayName") as string;
    const birthDate = formData.get("birthDate") as string;
    const bio = formData.get("bio") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;

    const jobTitle = formData.get("jobTitle") as string;
    const hourlyRate = formData.get("hourlyRate") as string;
    const yearsOfExperience = formData.get("yearsOfExperience") as string;

    const socialGithub = formData.get("socialGithub") as string;
    const socialLinkedin = formData.get("socialLinkedin") as string;

    const skillsString = formData.get("skills") as string;
    const portfolioString = formData.get("portfolio") as string;
    const certificatesString = formData.get("certificates") as string;

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    const profileImage = formData.get("profileImage") as File | null;

    const skillsParsed = safeJsonArray(skillsString, "skills");
    if (!skillsParsed.ok) return { success: false, error: skillsParsed.error };
    const portfolioParsed = safeJsonArray(portfolioString, "portfolio");
    if (!portfolioParsed.ok)
      return { success: false, error: portfolioParsed.error };
    const certificatesParsed = safeJsonArray(certificatesString, "certificates");
    if (!certificatesParsed.ok)
      return { success: false, error: certificatesParsed.error };

    const updateData: any = {
      name,
      displayName,
      birthDate: birthDate ? new Date(birthDate) : null,
      bio: bio || null,
      city: city || null,
      state: state || null,

      jobTitle: jobTitle || null,
      hourlyRate: hourlyRate ? new Prisma.Decimal(hourlyRate) : null,
      yearsOfExperience: yearsOfExperience
        ? parseInt(yearsOfExperience)
        : null,

      socialGithub: socialGithub || null,
      socialLinkedin: socialLinkedin || null,

      skills: skillsParsed.value,
      portfolio: portfolioParsed.value,
      certificates: certificatesParsed.value,
    };

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
