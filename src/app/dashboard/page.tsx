import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getPostLoginPath } from "@/modules/auth/lib/account-access";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ newChat?: string }>;
}) {
  const { newChat } = await searchParams;
  const session = await verifySession();

  if (!session?.sub) {
    redirect("/login");
  }

  if (session.userType === "CLIENT" && newChat) {
    redirect(`/dashboard/chat?newChat=${encodeURIComponent(newChat)}`);
  }

  redirect(getPostLoginPath(session));
}
