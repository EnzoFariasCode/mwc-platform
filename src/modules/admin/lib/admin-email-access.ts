import type { Prisma } from "@prisma/client";

import type { AdminRole } from "./admin-permissions";

const financialEmailConditions: Prisma.EmailOutboxWhereInput[] = [
  { entityType: "WITHDRAWAL_REQUEST" },
  { eventType: { startsWith: "FINANCE_" } },
  { eventType: { startsWith: "ADMIN_WITHDRAWAL_" } },
  { eventType: { startsWith: "STRIPE_" } },
];

export function adminEmailAccessWhere(
  adminRole: AdminRole | null | undefined,
): Prisma.EmailOutboxWhereInput {
  if (!adminRole) return { id: "__ADMIN_EMAIL_ACCESS_DENIED__" };
  if (adminRole === "OWNER") return {};
  if (adminRole === "FINANCE") return { OR: financialEmailConditions };

  return { NOT: { OR: financialEmailConditions } };
}

export function canAdminAccessEmailMetadata(
  adminRole: AdminRole | null,
  email: { eventType: string; entityType: string | null },
) {
  if (!adminRole) return false;
  if (adminRole === "OWNER") return true;

  const isFinancial =
    email.entityType === "WITHDRAWAL_REQUEST" ||
    email.eventType.startsWith("FINANCE_") ||
    email.eventType.startsWith("ADMIN_WITHDRAWAL_") ||
    email.eventType.startsWith("STRIPE_");

  return adminRole === "FINANCE" ? isFinancial : !isFinancial;
}
