import { jwtVerify } from "jose";

// 1. Definimos a chave uma vez só (com fallback para evitar crash)
const secretKey = process.env.AUTH_SECRET || "chave-secreta-padrao-dev-123";
const key = new TextEncoder().encode(secretKey);

export async function verifySession(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    // Se o token for inválido, expirado ou vazio, retorna null
    return null;
  }
}

// (Opcional) Alias para manter compatibilidade se chamarmos de 'decrypt' em outro lugar
export const decrypt = verifySession;
