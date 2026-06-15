import "server-only";
import { auth, signOut } from "@/auth";
import { Industry, UserType } from "@prisma/client";
import { db } from "@/lib/prisma";

type SessionPayload = {
  sub: string;
  role?: string;
  industry?: Industry | string;
  userType?: UserType | string;
};

async function isUserActive(userId: string) {
  const users = await db.$queryRaw<Array<{ isActive: boolean }>>`
    SELECT "isActive"
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return users[0]?.isActive === true;
}

// --- VERIFICAR SESSAO (NEXTAUTH) ---
export async function verifySession(): Promise<SessionPayload | null> {
  const session = await auth();

  if (!session?.user?.id) return null;

  if (session.user.isActive === false) return null;

  const active = await isUserActive(session.user.id);
  if (!active) return null;

  return {
    sub: session.user.id,
    role: session.user.role,
    industry: session.user.industry,
    userType: session.user.userType,
  };
}

// --- DELETAR SESSAO (LOGOUT) ---
export async function deleteSession() {
  await signOut({ redirect: false });
}

// Alias util
export const decrypt = verifySession;
