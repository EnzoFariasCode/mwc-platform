"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { ActionResponse } from "@/types/user-types";
import { Resend } from "resend"; // <--- NOVO IMPORT

// Inicializa o Resend com a sua chave do .env
const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TTL_MINUTES = 15;

function hashResetCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// 1. Solicitar codigo
export async function requestResetCode(email: string): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });

    // Se não achar o usuário, segura 1 segundo e finge sucesso (Segurança contra brute force)
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    }

    // Gera o código de 6 dígitos
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashResetCode(code);
    const expiry = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    // Salva no banco
    await db.user.update({
      where: { id: user.id },
      data: { resetCode: codeHash, resetCodeExpiry: expiry },
    });

    const devToolsEnabled = process.env.ENABLE_DEV_TOOLS === "true";
    if (devToolsEnabled && process.env.NODE_ENV !== "production") {
      console.log(`RESET CODE FOR ${email}: ${code}`);
    }

    // ==========================================
    // ENVIO REAL DO E-MAIL VIA RESEND
    // ==========================================
    try {
      await resend.emails.send({
        from: "MWC Platform <onboarding@resend.dev>", // Em produção você vai trocar pelo seu domínio
        to: email,
        subject: "Código de Recuperação de Senha - MWC",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d73cbe;">Recuperação de Senha</h2>
            <p>Olá, <strong>${user.name || "Usuário"}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na MWC Platform.</p>
            <p>Seu código de verificação é:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; letter-spacing: 8px; font-weight: bold; color: #1f2937; margin: 20px 0;">
              ${code}
            </div>
            <p style="font-size: 14px; color: #6b7280;">Este código é válido por ${RESET_TTL_MINUTES} minutos.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">Se você não solicitou essa alteração, pode ignorar este e-mail em segurança.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de reset via Resend:", emailError);
      // Aqui nós logamos o erro interno, mas retornamos sucesso para o usuário para não dar pistas
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro interno." };
  }
}

// 2. Verificar codigo
export async function verifyResetCode(
  email: string,
  code: string,
): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });
    const codeHash = hashResetCode(code);

    if (
      !user ||
      !user.resetCode ||
      user.resetCode !== codeHash ||
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

// 3. Redefinir senha
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<ActionResponse> {
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Operação inválida." };

    const codeHash = hashResetCode(code);

    if (
      !user.resetCode ||
      user.resetCode !== codeHash ||
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
