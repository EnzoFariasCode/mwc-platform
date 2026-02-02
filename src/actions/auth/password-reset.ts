"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/types/user-types";

// 1. SOLICITAR CÓDIGO (Mantém igual)
export async function requestResetCode(email: string): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await db.user.update({
      where: { id: user.id },
      data: { resetCode: code, resetCodeExpiry: expiry },
    });

    console.log("========================================");
    console.log(`🔐 CÓDIGO PARA ${email}: ${code}`);
    console.log("========================================");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro interno." };
  }
}

// --- [NOVO] 2. APENAS VERIFICAR SE O CÓDIGO BATE (Para mudar de tela) ---
export async function verifyResetCode(
  email: string,
  code: string,
): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.resetCode ||
      user.resetCode !== code ||
      !user.resetCodeExpiry ||
      new Date() > user.resetCodeExpiry
    ) {
      return { success: false, error: "Código inválido ou expirado." };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao verificar código." };
  }
}

// 3. REDEFINIR SENHA FINAL (Mantém a lógica, mas agora é o passo final)
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Operação inválida." };

    // Re-verificamos por segurança (o front pode ser burlado, o back não)
    if (
      !user.resetCode ||
      user.resetCode !== code ||
      !user.resetCodeExpiry ||
      new Date() > user.resetCodeExpiry
    ) {
      return { success: false, error: "Código inválido ou expirado." };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,20}$/;
    if (!passwordRegex.test(newPassword)) {
      return { success: false, error: "A senha não atende aos requisitos." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar senha." };
  }
}
