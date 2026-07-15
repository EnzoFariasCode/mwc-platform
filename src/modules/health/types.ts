export type HealthAvailabilityRule = {
  active: boolean;
  start: string;
  end: string;
};

export type HealthAvailability =
  | Record<string, HealthAvailabilityRule | undefined>
  | string
  | null;

export type HealthProfessionalProfile = {
  id: string;
  name: string | null;
  displayName?: string | null;
  birthDate?: Date | string | null;
  phone?: string | null;
  cep?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  onlineSpecialty?:
    | "PSYCHOLOGIST"
    | "NUTRITIONIST"
    | "PERSONAL_TRAINER"
    | "TEACHER"
    | "LAWYER"
    | null;
  teachingSubject?: string | null;
  documentReg?: string | null;
  approach?: string | null;
  consultationFee?: unknown;
  sessionDuration?: number | null;
  timezone?: string | null;
  hasProfileImage?: boolean;
  availabilities?: Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
  availability?: unknown;
};
