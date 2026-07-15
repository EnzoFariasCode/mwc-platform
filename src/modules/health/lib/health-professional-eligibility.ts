import type { Prisma } from "@prisma/client";

const REGULATED_ONLINE_SPECIALTIES = [
  "PSYCHOLOGIST",
  "NUTRITIONIST",
  "PERSONAL_TRAINER",
  "LAWYER",
] as const;

export function isOnlineSpecialtyOperational(
  specialty: string | null | undefined,
) {
  return (
    specialty !== "LAWYER" ||
    process.env.ENABLE_MWC_ONLINE_LAWYERS === "true"
  );
}

type ProfessionalIdentityInput = {
  onlineSpecialty: string | null | undefined;
  documentReg: string | null | undefined;
  teachingSubject: string | null | undefined;
};

export function getEligibleHealthProfessionalWhere(
  now = new Date(),
): Prisma.UserWhereInput {
  const lawyersEnabled = isOnlineSpecialtyOperational("LAWYER");

  return {
    userType: "PROFESSIONAL",
    industry: "HEALTH",
    isActive: true,
    onlineSpecialty: { not: null },
    ...(lawyersEnabled
      ? {}
      : { AND: [{ onlineSpecialty: { not: "LAWYER" } }] }),
    professionalVerification: {
      is: {
        status: "APPROVED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    },
    OR: [
      {
        onlineSpecialty: "TEACHER",
        teachingSubject: { not: null },
        NOT: { teachingSubject: "" },
      },
      {
        onlineSpecialty: { in: [...REGULATED_ONLINE_SPECIALTIES] },
        documentReg: { not: null },
        NOT: { documentReg: "" },
      },
    ],
  };
}

export function hasValidProfessionalRegistration(
  documentReg: string | null | undefined,
) {
  return Boolean(documentReg?.trim());
}

export function isTeacherOnlineSpecialty(
  onlineSpecialty: string | null | undefined,
) {
  return onlineSpecialty === "TEACHER";
}

export function hasValidTeachingSubject(
  teachingSubject: string | null | undefined,
) {
  return Boolean(teachingSubject?.trim());
}

export function hasValidHealthProfessionalIdentity({
  onlineSpecialty,
  documentReg,
  teachingSubject,
}: ProfessionalIdentityInput) {
  if (isTeacherOnlineSpecialty(onlineSpecialty)) {
    return hasValidTeachingSubject(teachingSubject);
  }

  return (
    REGULATED_ONLINE_SPECIALTIES.some(
      (specialty) => specialty === onlineSpecialty,
    ) && hasValidProfessionalRegistration(documentReg)
  );
}

export function getHealthProfessionalIdentityError(
  input: ProfessionalIdentityInput,
) {
  if (!input.onlineSpecialty) {
    return "Categoria profissional do MWC Online nao configurada.";
  }

  if (isTeacherOnlineSpecialty(input.onlineSpecialty)) {
    return hasValidTeachingSubject(input.teachingSubject)
      ? null
      : "Informe sua materia ou area de ensino.";
  }

  return hasValidProfessionalRegistration(input.documentReg)
    ? null
    : "Informe o tipo e o numero do registro profissional.";
}
