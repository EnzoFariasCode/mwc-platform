import type { Prisma } from "@prisma/client";

export const eligibleHealthProfessionalWhere = {
  userType: "PROFESSIONAL",
  industry: "HEALTH",
  isActive: true,
  documentReg: { not: "" },
} satisfies Prisma.UserWhereInput;

export function hasValidProfessionalRegistration(
  documentReg: string | null | undefined,
) {
  return Boolean(documentReg?.trim());
}
