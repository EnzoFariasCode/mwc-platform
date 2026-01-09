"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/prisma"; // <--- ATENÇÃO: Verifique se o seu prisma é importado daqui
import bcrypt from "bcryptjs";
import { ActionResponse } from "@/types/user-types"; // Usando sua tipagem padrão

// Tipagem dos dados que vêm do formulário/modal
interface UpdateProfileData {
  name: string;
  displayName: string;
  birthDate: string;
  bio?: string; // O campo novo
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResponse> {
  try {
    // 1. Pega a sessão (Lendo o cookie manualmente, igual você fez no login)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // 2. Busca o usuário no banco para checar senha (se necessário)
    const userInDb = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userInDb) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // 3. Lógica de Alteração de Senha
    let passwordHash = undefined;

    if (data.newPassword && data.newPassword.trim() !== "") {
      // Verifica se mandou a senha atual
      if (!data.currentPassword) {
        return { success: false, error: "Informe a senha atual para alterar." };
      }

      // Compara a senha atual enviada com a do banco
      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        userInDb.password // Assumindo que o campo no banco chama 'password'
      );

      if (!isPasswordValid) {
        return { success: false, error: "Senha atual incorreta." };
      }

      // Cria o hash da nova senha
      passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    // 4. Atualiza no Banco de Dados
    await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        displayName: data.displayName,
        birthDate: data.birthDate,
        bio: data.bio, // Salvando a Bio aqui!
        // Só atualiza a senha se passwordHash tiver valor
        ...(passwordHash && { password: passwordHash }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { success: false, error: "Erro interno ao atualizar perfil." };
  }
}
