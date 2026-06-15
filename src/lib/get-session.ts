import "server-only";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getUserSession() {
  const session = await auth();

  if (!session?.user?.id) return null;

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
