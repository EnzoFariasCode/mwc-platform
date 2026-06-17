import "server-only";
import { auth, signOut } from "@/auth";
import { Industry, UserType } from "@prisma/client";
import { db } from "@/lib/prisma";
import { normalizeAdminRole } from "@/modules/admin/lib/admin-permissions";

type SessionPayload = {
  sub: string;
  role?: string;
  industry?: Industry | string;
  userType?: UserType | string;
  adminRole?: "OWNER" | "FINANCE" | "SUPPORT" | null;
};

async function isUserActive(userId: string) {
  const users = await db.$queryRaw<
    Array<{
      isActive: boolean;
      adminRole: "OWNER" | "FINANCE" | "SUPPORT" | null;
      userType: string;
    }>
  >`
    SELECT "isActive", "adminRole", "userType"
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return users[0] ?? null;
}

// --- VERIFICAR SESSAO (NEXTAUTH) ---
export async function verifySession(): Promise<SessionPayload | null> {
  const session = await auth();

  if (!session?.user?.id) return null;

  if (session.user.isActive === false) return null;

  const user = await isUserActive(session.user.id);
  if (!user?.isActive) return null;

  const userType = session.user.userType ?? user.userType;
  const adminRole = normalizeAdminRole({
    userType,
    adminRole: session.user.adminRole ?? user.adminRole,
  });

  return {
    sub: session.user.id,
    role: session.user.role,
    industry: session.user.industry,
    userType,
    adminRole,
  };
}

// --- DELETAR SESSAO (LOGOUT) ---
export async function deleteSession() {
  await signOut({ redirect: false });
}

// Alias util
export const decrypt = verifySession;
