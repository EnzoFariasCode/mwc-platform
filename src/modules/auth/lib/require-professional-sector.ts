import "server-only";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/get-session";
import {
  getAccountDashboardPath,
  type ProfessionalIndustry,
} from "@/modules/auth/lib/account-access";

export async function requireProfessionalSector(
  requiredIndustry: ProfessionalIndustry,
) {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  if (
    session.userType !== "PROFESSIONAL" ||
    session.industry !== requiredIndustry
  ) {
    redirect(getAccountDashboardPath(session));
  }

  return session;
}
