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
    Array<{ isActive: boolean; adminRole: AdminRole | null; userType: string }>
  >`
    SELECT "isActive", "adminRole", "userType"
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

  const userType = session.user.userType ?? user.userType;
  const adminRole = normalizeAdminRole({
    userType,
    adminRole: user.adminRole,
  });

  return {
    id: session.user.id,
    role: session.user.role,
    userType,
    industry: session.user.industry,
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

export async function requireAdminRole(allowedRoles: AdminRole[]) {
  const session = await requireAdminUser();

  if (!canAccessAdminRoles(session.adminRole, allowedRoles)) {
    redirect("/");
  }

  return session;
}
