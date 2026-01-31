"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActionResponse } from "@/types/user-types";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Agora a função recebe FormData em vez de um objeto JSON
export async function updateProfile(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();

    // --- 1. SEGURANÇA (JWT) ---
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    const userId = session?.sub as string;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // --- 2. Busca usuário no banco ---
    const userInDb = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // --- 3. Extração dos Dados do FormData ---
    // FormData retorna tudo como string ou File, então precisamos converter
    const name = formData.get("name") as string;
    const displayName = formData.get("displayName") as string;
    const birthDate = formData.get("birthDate") as string;
    const bio = formData.get("bio") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;

    // Campos Profissionais
    const jobTitle = formData.get("jobTitle") as string;
    const hourlyRate = formData.get("hourlyRate") as string;
    const yearsOfExperience = formData.get("yearsOfExperience") as string;

    // Redes Sociais
    const socialGithub = formData.get("socialGithub") as string;
    const socialLinkedin = formData.get("socialLinkedin") as string;

    // Arrays JSON (Skills, Portfolio, Certificados)
    // O frontend envia como string JSON (JSON.stringify), então fazemos o parse aqui
    const skillsString = formData.get("skills") as string;
    const portfolioString = formData.get("portfolio") as string;
    const certificatesString = formData.get("certificates") as string;

    // Senha
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    // Arquivo de Imagem
    const profileImage = formData.get("profileImage") as File | null;

    // --- 4. Preparação do Objeto de Update ---
    const updateData: any = {
      name,
      displayName,
      birthDate: birthDate ? new Date(birthDate) : null,
      bio: bio || null,
      city: city || null,
      state: state || null,

      // Profissional
      jobTitle: jobTitle || null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,

      // Redes
      socialGithub: socialGithub || null,
      socialLinkedin: socialLinkedin || null,

      // Arrays (com proteção contra erro de parse)
      skills: skillsString ? JSON.parse(skillsString) : [],
      portfolio: portfolioString ? JSON.parse(portfolioString) : [],
      certificates: certificatesString ? JSON.parse(certificatesString) : [],
    };

    // --- 5. Lógica de Imagem (NOVO) ---
    if (profileImage && profileImage.size > 0) {
      // Converte o arquivo recebido para Buffer (Bytes) que o Prisma aceita
      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      updateData.profileImageBytes = buffer;
      updateData.profileImageType = profileImage.type;
    }

    // --- 6. Lógica de Senha (Mantida a sua lógica original) ---
    if (newPassword && newPassword.trim() !== "") {
      if (!currentPassword) {
        return { success: false, error: "Informe a senha atual para alterar." };
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        userInDb.password,
      );

      if (!isPasswordValid) {
        return { success: false, error: "Senha atual incorreta." };
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.password = passwordHash;
    }

    // --- 7. Atualização no Banco de Dados ---
    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    // --- 8. ATUALIZAR O CACHE ---
    revalidatePath("/dashboard/perfil");
    revalidatePath("/dashboard/cliente");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    // --- MELHORIA AQUI: Imprime o erro completo ---
    console.error("Erro DETALHADO ao atualizar perfil:", error);

    // Tenta pegar a mensagem de erro se ela existir
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    return {
      success: false,
      error: `Erro interno: ${errorMessage}`, // Retorna o detalhe para o front (só para testar)
    };
  }
}
