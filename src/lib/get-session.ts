import "server-only";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import {
  AdminRole,
  canAccessAdminRoles,
  normalizeAdminRole,
} from "@/modules/admin/lib/admin-permissions";

async function isUserActive(userId: string) {
  const users = await db.$queryRaw<
    Array<{
      isActive: boolean;
      adminRole: AdminRole | null;
      userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
      industry: "TECH" | "HEALTH";
    }>
  >`
    SELECT "isActive", "adminRole", "userType", industry
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return users[0] ?? null;
}

export async function getUserSession() {
  const session = await auth();

  if (!session?.user?.id) return null;

  if (session.user.isActive === false) return null;

  const user = await isUserActive(session.user.id);
  if (!user?.isActive) return null;

  // O banco e a fonte de verdade para autorizacao; a sessao pode estar obsoleta.
  const userType = user.userType;
  const adminRole = normalizeAdminRole({
    userType,
    adminRole: user.adminRole,
  });

  return {
    id: session.user.id,
    role: session.user.role,
    userType,
    industry: user.industry,
    jobTitle: session.user.jobTitle,
    adminRole,
  };
}

export async function requireAdminUser() {
  const session = await getUserSession();

  if (session?.userType !== "ADMIN") {
    redirect("/");
  }

  return session;
}

export async function getAdminAccess(allowedRoles: AdminRole[]) {
  const session = await getUserSession();

  if (!session) {
    return { status: "UNAUTHENTICATED" as const };
  }

  if (
    session.userType !== "ADMIN" ||
    !canAccessAdminRoles(session.adminRole, allowedRoles)
  ) {
    return { status: "FORBIDDEN" as const };
  }

  return { status: "AUTHORIZED" as const, session };
}

export async function requireAdminRole(allowedRoles: AdminRole[]) {
  const access = await getAdminAccess(allowedRoles);

  if (access.status !== "AUTHORIZED") {
    redirect("/");
  }

  return access.session;
}
