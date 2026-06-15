import "server-only";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

async function isUserActive(userId: string) {
  const users = await db.$queryRaw<Array<{ isActive: boolean }>>`
    SELECT "isActive"
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return users[0]?.isActive === true;
}

export async function getUserSession() {
  const session = await auth();

  if (!session?.user?.id) return null;

  if (session.user.isActive === false) return null;

  const active = await isUserActive(session.user.id);
  if (!active) return null;

  return {
    id: session.user.id,
    role: session.user.role,
    userType: session.user.userType,
    industry: session.user.industry,
    jobTitle: session.user.jobTitle,
  };
}

export async function requireAdminUser() {
  const session = await getUserSession();

  if (session?.userType !== "ADMIN") {
    redirect("/");
  }

  return session;
}
