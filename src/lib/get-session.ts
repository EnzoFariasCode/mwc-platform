import "server-only";
import { auth } from "@/auth";

export async function getUserSession() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    role: session.user.role,
  };
}
