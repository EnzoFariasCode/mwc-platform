// src/lib/get-session.ts
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Retorna os dados que salvamos no token (sub = id, role = userType)
    return {
      id: payload.sub as string,
      role: payload.role as string,
      // Se precisar do email no token, você teria que ter salvo no login.
      // Por enquanto, vamos buscar o email no banco na action se precisar.
    };
  } catch (error) {
    return null;
  }
}
