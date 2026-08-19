import {
  hasValidBookableAvailability,
  hasValidHealthProfessionalIdentity,
} from "./health-professional-eligibility";
import { isValidTimeZone } from "./appointment-completion-time";
import { isProfessionalVerificationApproved } from "./professional-verification-policy";

export type HealthProfileCompletionSection =
  | "professional"
  | "schedule"
  | "personal";

export type HealthProfileCompletionItem = {
  key: string;
  label: string;
  section: HealthProfileCompletionSection;
  done: boolean;
  required: boolean;
};

export type HealthOnboardingAction =
  | "personal"
  | "professional"
  | "verification"
  | "schedule";

export type HealthOnboardingStepStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "CHANGES_REQUIRED"
  | "COMPLETED"
  | "BLOCKED";

export type HealthOnboardingStep = {
  key: "personal" | "professional" | "verification" | "schedule" | "publication";
  label: string;
  description: string;
  status: HealthOnboardingStepStatus;
  action: HealthOnboardingAction | null;
};

type HealthProfileCompletionInput = {
  displayName?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  onlineSpecialty: string | null | undefined;
  teachingSubject: string | null | undefined;
  documentReg: string | null | undefined;
  professionalVerification?: {
    specialty?: string | null;
    status?: string | null;
    expiresAt?: Date | string | null;
  } | null;
  approach?: string | null;
  consultationFee?: unknown;
  sessionDuration?: number | null;
  timezone?: string | null;
  hasProfileImage?: boolean;
  birthDate?: Date | string | null;
  phone?: string | null;
  cep?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  availabilities?: Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
  specialtyOperational?: boolean;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasMinimumAppointmentFee(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 1;
}

function sectionStatus(items: HealthProfileCompletionItem[]) {
  if (items.every((item) => item.done)) return "COMPLETED" as const;
  if (items.some((item) => item.done)) return "IN_PROGRESS" as const;
  return "PENDING" as const;
}

function verificationStepStatus(
  profile: HealthProfileCompletionInput,
  verificationItems: HealthProfileCompletionItem[],
): HealthOnboardingStepStatus {
  if (verificationItems.every((item) => item.done)) return "COMPLETED";

  const status = profile.professionalVerification?.status;
  if (status === "PENDING" || status === "UNDER_REVIEW") return "UNDER_REVIEW";
  if (
    status &&
    ["CHANGES_REQUIRED", "REJECTED", "SUSPENDED", "EXPIRED"].includes(status)
  ) {
    return "CHANGES_REQUIRED";
  }

  return verificationItems.some((item) => item.done) || status === "DRAFT"
    ? "IN_PROGRESS"
    : "PENDING";
}

export function getHealthProfileCompletion(
  profile: HealthProfileCompletionInput,
) {
  const verificationSpecialty = profile.professionalVerification?.specialty;
  const categoryMatchesVerification =
    !verificationSpecialty || verificationSpecialty === profile.onlineSpecialty;

  const items: HealthProfileCompletionItem[] = [
    {
      key: "displayName",
      label: "Nome de exibicao",
      section: "professional",
      done: hasText(profile.displayName),
      required: true,
    },
    {
      key: "bio",
      label: "Biografia",
      section: "professional",
      done: hasText(profile.bio),
      required: true,
    },
    {
      key: "category",
      label: "Categoria profissional",
      section: "professional",
      done:
        Boolean(profile.onlineSpecialty) &&
        hasText(profile.jobTitle) &&
        categoryMatchesVerification,
      required: true,
    },
    {
      key: "identity",
      label:
        profile.onlineSpecialty === "TEACHER"
          ? "Especialidade de ensino"
          : "Registro profissional",
      section: "professional",
      done: hasValidHealthProfessionalIdentity(profile),
      required: true,
    },
    {
      key: "verification",
      label: "Verificacao profissional",
      section: "professional",
      done: isProfessionalVerificationApproved(profile.professionalVerification),
      required: true,
    },
    {
      key: "approach",
      label:
        profile.onlineSpecialty === "TEACHER"
          ? "Metodologia de ensino"
          : "Abordagem profissional",
      section: "professional",
      done: hasText(profile.approach),
      required: true,
    },
    {
      key: "fee",
      label: "Valor do atendimento",
      section: "professional",
      done: hasMinimumAppointmentFee(profile.consultationFee),
      required: true,
    },
    {
      key: "session",
      label: "Duracao e fuso horario",
      section: "schedule",
      done:
        Number.isInteger(profile.sessionDuration) &&
        Number(profile.sessionDuration) > 0 &&
        Boolean(profile.timezone && isValidTimeZone(profile.timezone)),
      required: true,
    },
    {
      key: "schedule",
      label: "Agenda de atendimento",
      section: "schedule",
      done: hasValidBookableAvailability(profile.availabilities),
      required: true,
    },
    {
      key: "photo",
      label: "Foto de perfil",
      section: "personal",
      done: Boolean(profile.hasProfileImage),
      required: true,
    },
    {
      key: "birthDate",
      label: "Data de nascimento",
      section: "personal",
      done: Boolean(profile.birthDate),
      required: true,
    },
    {
      key: "phone",
      label: "Telefone de contato",
      section: "personal",
      done: hasText(profile.phone),
      required: true,
    },
    {
      key: "address",
      label: "Endereco completo (opcional)",
      section: "personal",
      done: [
        profile.cep,
        profile.address,
        profile.addressNumber,
        profile.neighborhood,
        profile.city,
        profile.state,
      ].every(hasText),
      required: false,
    },
  ];

  const requiredItems = items.filter((item) => item.required);
  const optionalItems = items.filter((item) => !item.required);
  const done = requiredItems.filter((item) => item.done).length;
  const total = requiredItems.length;
  const missingItems = requiredItems.filter((item) => !item.done);
  const personalItems = requiredItems.filter((item) => item.section === "personal");
  const professionalItems = requiredItems.filter(
    (item) =>
      item.section === "professional" &&
      !["identity", "verification"].includes(item.key),
  );
  const verificationItems = requiredItems.filter((item) =>
    ["identity", "verification"].includes(item.key),
  );
  const scheduleItems = requiredItems.filter((item) => item.section === "schedule");
  const readyForPublication = missingItems.length === 0;
  const publicationComplete =
    readyForPublication && profile.specialtyOperational !== false;

  const steps: HealthOnboardingStep[] = [
    {
      key: "personal",
      label: "Dados pessoais",
      description: "Foto, data de nascimento e telefone",
      status: sectionStatus(personalItems),
      action: "personal",
    },
    {
      key: "professional",
      label: "Perfil profissional",
      description: "Apresentacao, categoria, abordagem e valor",
      status: sectionStatus(professionalItems),
      action: "professional",
    },
    {
      key: "verification",
      label: "Verificacao profissional",
      description: "Registro e documentos obrigatorios",
      status: verificationStepStatus(profile, verificationItems),
      action: "verification",
    },
    {
      key: "schedule",
      label: "Agenda",
      description: "Duracao, fuso horario e disponibilidade",
      status: sectionStatus(scheduleItems),
      action: "schedule",
    },
    {
      key: "publication",
      label: "Publicacao do perfil",
      description: publicationComplete
        ? "Perfil visivel e disponivel para agendamentos"
        : "Liberada automaticamente apos todos os requisitos",
      status: publicationComplete ? "COMPLETED" : "BLOCKED",
      action: null,
    },
  ];

  const actionableSteps = steps.filter(
    (step) => step.action && step.status !== "COMPLETED",
  );
  const nextStep =
    actionableSteps.find((step) => step.status !== "UNDER_REVIEW") ??
    actionableSteps[0] ??
    null;

  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    items,
    requiredItems,
    optionalItems,
    missingItems,
    steps,
    nextStep,
    completedSteps: steps.filter((step) => step.status === "COMPLETED").length,
    readyForPublication,
    publicationComplete,
    sections: {
      professional: [...professionalItems, ...verificationItems].every(
        (item) => item.done,
      ),
      schedule: scheduleItems.every((item) => item.done),
      personal: personalItems.every((item) => item.done),
    },
  };
}

export type HealthProfileCompletion = ReturnType<
  typeof getHealthProfileCompletion
>;
