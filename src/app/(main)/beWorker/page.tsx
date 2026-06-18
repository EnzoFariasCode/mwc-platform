import { getUserSession } from "@/lib/get-session";
import { db } from "@/lib/prisma";

import StandardHeader from "@/components/ui/StandardHeader";
import FooterContact from "@/components/ui/FooterContact";
import BeWorkerClient from "@/modules/landing/worker/BeWorkerClient";

export default async function HowToBeWorkerPage() {
  const session = await getUserSession();
  let userStatus: "active" | "inactive" | null = null;
  let userType: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null = null;
  let industry: "TECH" | "HEALTH" | null = null;

  if (session?.id) {
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        stripeSubscriptionStatus: true,
        userType: true,
        industry: true,
      },
    });

    userStatus =
      user?.stripeSubscriptionStatus === "active" ? "active" : "inactive";
    userType = user?.userType || null;
    industry = user?.industry || null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <StandardHeader />

      <BeWorkerClient
        isLoggedIn={!!session}
        userStatus={userStatus}
        userType={userType}
        industry={industry}
      />

      <FooterContact />
    </div>
  );
}
