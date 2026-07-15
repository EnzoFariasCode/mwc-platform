import { hasValidHealthProfessionalIdentity } from "./health-professional-eligibility";

export type HealthProfileCompletionSection =
  | "professional"
  | "schedule"
  | "personal";

export type HealthProfileCompletionItem = {
  key: string;
  label: string;
  section: HealthProfileCompletionSection;
  done: boolean;
};

type HealthProfileCompletionInput = {
  displayName?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  onlineSpecialty: string | null | undefined;
  teachingSubject: string | null | undefined;
  documentReg: string | null | undefined;
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
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasPositiveMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function getHealthProfileCompletion(
  profile: HealthProfileCompletionInput,
) {
  const items: HealthProfileCompletionItem[] = [
    {
      key: "displayName",
      label: "Nome de exibicao",
      section: "professional",
      done: hasText(profile.displayName),
    },
    {
      key: "bio",
      label: "Biografia",
      section: "professional",
      done: hasText(profile.bio),
    },
    {
      key: "category",
      label: "Categoria profissional",
      section: "professional",
      done: Boolean(profile.onlineSpecialty) && hasText(profile.jobTitle),
    },
    {
      key: "identity",
      label:
        profile.onlineSpecialty === "TEACHER"
          ? "Especialidade de ensino"
          : "Registro profissional",
      section: "professional",
      done: hasValidHealthProfessionalIdentity(profile),
    },
    {
      key: "approach",
      label:
        profile.onlineSpecialty === "TEACHER"
          ? "Metodologia de ensino"
          : "Abordagem profissional",
      section: "professional",
      done: hasText(profile.approach),
    },
    {
      key: "fee",
      label: "Valor do atendimento",
      section: "professional",
      done: hasPositiveMoney(profile.consultationFee),
    },
    {
      key: "session",
      label: "Duracao e fuso horario",
      section: "professional",
      done:
        Boolean(profile.sessionDuration && profile.sessionDuration > 0) &&
        hasText(profile.timezone),
    },
    {
      key: "schedule",
      label: "Agenda de atendimento",
      section: "schedule",
      done: Boolean(
        profile.availabilities?.some(
          (availability) =>
            availability.isActive &&
            availability.startTime < availability.endTime,
        ),
      ),
    },
    {
      key: "photo",
      label: "Foto de perfil",
      section: "personal",
      done: Boolean(profile.hasProfileImage),
    },
    {
      key: "birthDate",
      label: "Data de nascimento",
      section: "personal",
      done: Boolean(profile.birthDate),
    },
    {
      key: "phone",
      label: "Telefone de contato",
      section: "personal",
      done: hasText(profile.phone),
    },
    {
      key: "address",
      label: "Endereco completo",
      section: "personal",
      done: [
        profile.cep,
        profile.address,
        profile.addressNumber,
        profile.neighborhood,
        profile.city,
        profile.state,
      ].every(hasText),
    },
  ];

  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const missingItems = items.filter((item) => !item.done);

  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    items,
    missingItems,
    sections: {
      professional: items
        .filter((item) => item.section === "professional")
        .every((item) => item.done),
      schedule: items
        .filter((item) => item.section === "schedule")
        .every((item) => item.done),
      personal: items
        .filter((item) => item.section === "personal")
        .every((item) => item.done),
    },
  };
}

export type HealthProfileCompletion = ReturnType<
  typeof getHealthProfileCompletion
>;
