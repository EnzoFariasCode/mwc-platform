import type { Prisma } from "@prisma/client";
import { isValidTimeZone } from "./appointment-completion-time";
import { isProfessionalVerificationApproved } from "./professional-verification-policy";

const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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

type ProfessionalAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type BookableHealthProfessionalInput = ProfessionalIdentityInput & {
  displayName?: string | null;
  bio?: string | null;
  approach?: string | null;
  birthDate?: Date | string | null;
  phone?: string | null;
  hasProfileImage?: boolean;
  profileImageBytes?: Uint8Array | null;
  image?: string | null;
  jobTitle: string | null | undefined;
  consultationFee: unknown;
  sessionDuration: number | null | undefined;
  timezone: string | null | undefined;
  availabilities: ProfessionalAvailabilityInput[] | null | undefined;
  professionalVerification?: {
    specialty?: string | null;
    status?: string | null;
    expiresAt?: Date | string | null;
  } | null;
};

export function getEligibleHealthProfessionalWhere(
  now = new Date(),
): Prisma.UserWhereInput {
  const lawyersEnabled = isOnlineSpecialtyOperational("LAWYER");

  return {
    userType: "PROFESSIONAL",
    industry: "HEALTH",
    isActive: true,
    onlineSpecialty: lawyersEnabled ? { not: null } : { notIn: ["LAWYER"] },
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
        professionalVerification: { is: { specialty: "TEACHER" } },
      },
      ...REGULATED_ONLINE_SPECIALTIES.map((specialty) => ({
        onlineSpecialty: specialty,
        documentReg: { not: null },
        NOT: { documentReg: "" },
        professionalVerification: { is: { specialty } },
      })),
    ],
  };
}

/** Regra canonica para qualquer perfil que possa ser encontrado e agendado. */
export function getBookableHealthProfessionalWhere(
  now = new Date(),
): Prisma.UserWhereInput {
  return {
    ...getEligibleHealthProfessionalWhere(now),
    displayName: { not: "" },
    bio: { not: "" },
    approach: { not: "" },
    birthDate: { not: null },
    phone: { not: "" },
    jobTitle: { not: null },
    consultationFee: { gte: 1 },
    sessionDuration: { gt: 0 },
    timezone: { not: "" },
    availabilities: {
      some: {
        isActive: true,
        startTime: { not: "" },
        endTime: { not: "" },
      },
    },
    AND: [
      {
        OR: [
          { profileImageBytes: { not: null } },
          { image: { not: "" } },
        ],
      },
    ],
  };
}

export function hasValidBookableAvailability(
  availabilities: ProfessionalAvailabilityInput[] | null | undefined,
) {
  return Boolean(
    availabilities?.some(
      (availability) =>
        availability.isActive &&
        Number.isInteger(availability.dayOfWeek) &&
        availability.dayOfWeek >= 0 &&
        availability.dayOfWeek <= 6 &&
        HH_MM_PATTERN.test(availability.startTime) &&
        HH_MM_PATTERN.test(availability.endTime) &&
        availability.startTime < availability.endTime,
    ),
  );
}

export function getHealthProfessionalBookingReadinessError(
  professional: BookableHealthProfessionalInput,
) {
  if (
    !isProfessionalVerificationApproved(
      professional.professionalVerification,
    )
  ) {
    return "A verificacao profissional precisa estar aprovada.";
  }

  const verificationSpecialty =
    professional.professionalVerification?.specialty;
  if (
    verificationSpecialty &&
    verificationSpecialty !== professional.onlineSpecialty
  ) {
    return "A categoria profissional nao corresponde a verificacao aprovada.";
  }

  const identityError = getHealthProfessionalIdentityError(professional);
  if (identityError) return identityError;

  if (!professional.displayName?.trim()) {
    return "Informe seu nome de exibicao.";
  }

  if (!professional.bio?.trim()) {
    return "Preencha sua biografia profissional.";
  }

  if (!professional.approach?.trim()) {
    return professional.onlineSpecialty === "TEACHER"
      ? "Informe sua metodologia de ensino."
      : "Informe sua abordagem profissional.";
  }

  if (!professional.birthDate) {
    return "Informe sua data de nascimento.";
  }

  if (!professional.phone?.trim()) {
    return "Informe seu telefone de contato.";
  }

  if (
    !professional.hasProfileImage &&
    !professional.profileImageBytes &&
    !professional.image?.trim()
  ) {
    return "Adicione uma foto de perfil.";
  }

  if (!professional.jobTitle?.trim()) {
    return "Informe seu titulo profissional.";
  }

  const fee = Number(professional.consultationFee);
  if (!Number.isFinite(fee) || fee < 1) {
    return "Informe um valor de atendimento de no minimo R$ 1,00.";
  }

  if (
    !Number.isInteger(professional.sessionDuration) ||
    Number(professional.sessionDuration) <= 0
  ) {
    return "Informe uma duracao valida para o atendimento.";
  }

  if (
    !professional.timezone?.trim() ||
    !isValidTimeZone(professional.timezone)
  ) {
    return "Informe um fuso horario valido.";
  }

  if (!hasValidBookableAvailability(professional.availabilities)) {
    return "Configure ao menos um periodo valido na agenda.";
  }

  return null;
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
