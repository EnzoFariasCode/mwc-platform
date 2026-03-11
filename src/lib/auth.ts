import "server-only";
import { auth, signOut } from "@/auth";

type SessionPayload = {
  sub: string;
  role?: string;
};

// --- VERIFICAR SESSAO (NEXTAUTH) ---
export async function verifySession(): Promise<SessionPayload | null> {
  const session = await auth();

  if (!session?.user?.id) return null;

  return {
    sub: session.user.id,
    role: session.user.role,
  };
}

// --- DELETAR SESSAO (LOGOUT) ---
export async function deleteSession() {
  await signOut({ redirect: false });
}

// Alias util
export const decrypt = verifySession;
