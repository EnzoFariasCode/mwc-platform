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
  professionalVerification?: {
    id: string;
    specialty:
      | "PSYCHOLOGIST"
      | "NUTRITIONIST"
      | "PERSONAL_TRAINER"
      | "TEACHER"
      | "LAWYER";
    status:
      | "DRAFT"
      | "PENDING"
      | "UNDER_REVIEW"
      | "CHANGES_REQUIRED"
      | "APPROVED"
      | "REJECTED"
      | "SUSPENDED"
      | "EXPIRED";
    council: "CRP" | "CRN" | "CREF" | "OAB" | "NOT_APPLICABLE";
    registrationNumber: string | null;
    registrationRegion: string | null;
    qualificationTitle: string | null;
    submittedAt: Date | string | null;
    reviewedAt: Date | string | null;
    reviewReason: string | null;
    verifiedAt: Date | string | null;
    expiresAt: Date | string | null;
    documents: Array<{
      id: string;
      type:
        | "IDENTITY_DOCUMENT"
        | "PROFESSIONAL_CREDENTIAL"
        | "QUALIFICATION_DOCUMENT";
      fileName: string;
      size: number;
      createdAt: Date | string;
    }>;
  } | null;
  hasProfileImage?: boolean;
  availabilities?: Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
  availability?: unknown;
};
