import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

// 1. Definição da chave
const secretKey = process.env.AUTH_SECRET || "chave-secreta-padrao-dev-123";
const key = new TextEncoder().encode(secretKey);

// --- 2. CRIAR SESSÃO (AQUI ESTÁ A MUDANÇA PARA OPÇÃO 1) ---
export async function createSession(userId: string) {
  // O Token JWT em si terá validade de 24h por segurança
  const session = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);

  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // --- O SEGREDO ESTÁ AQUI ---
    // Removemos o 'expires' e 'maxAge'.
    // Sem data de validade, o navegador entende que é um "Cookie de Sessão".
    // Ele será excluído automaticamente quando o navegador for fechado.
  });
}

// --- 3. VERIFICAR SESSÃO (SEU CÓDIGO ATUALIZADO) ---
export async function verifySession(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    // BLINDAGEM ANTI-ZUMBI 🧟‍♂️
    // Verifica se o usuário ainda existe no banco
    if (payload.sub) {
      const userExists = await db.user.findUnique({
        where: { id: payload.sub as string },
        select: { id: true },
      });

      if (!userExists) {
        return null;
      }
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// --- 4. DELETAR SESSÃO (LOGOUT) ---
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Alias útil
export const decrypt = verifySession;
