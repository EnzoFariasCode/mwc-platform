import "server-only"; // Boa prática: garante que isso só rode no servidor
import { jwtVerify } from "jose";
import { db } from "@/lib/prisma"; // <--- Importe o DB aqui

// 1. Definimos a chave
const secretKey = process.env.AUTH_SECRET || "chave-secreta-padrao-dev-123";
const key = new TextEncoder().encode(secretKey);

export async function verifySession(token: string | undefined = "") {
  try {
    // 1. Verifica a assinatura criptográfica e validade (data)
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    // --- BLINDAGEM ANTI-ZUMBI 🧟‍♂️ ---
    // Se o token é válido, verificamos se o usuário AINDA EXISTE no banco.
    if (payload.sub) {
      const userExists = await db.user.findUnique({
        where: { id: payload.sub as string },
        select: { id: true }, // Otimização: Só busca o ID, é levíssimo
      });

      // Se o usuário foi deletado, a sessão é inválida!
      if (!userExists) {
        return null;
      }
    }
    // -------------------------------

    return payload;
  } catch (error) {
    // Se o token for inválido, expirado ou vazio, retorna null
    return null;
  }
}

export const decrypt = verifySession;
