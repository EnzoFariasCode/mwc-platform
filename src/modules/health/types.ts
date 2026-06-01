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
  bio?: string | null;
  jobTitle?: string | null;
  documentReg?: string | null;
  approach?: string | null;
  consultationFee?: unknown;
  sessionDuration?: number | null;
  availabilities?: Array<{
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
  }>;
  availability?: unknown;
};
