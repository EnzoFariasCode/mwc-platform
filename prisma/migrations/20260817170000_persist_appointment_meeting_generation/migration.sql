CREATE TYPE "AppointmentMeetingGenerationStatus" AS ENUM (
  'NOT_STARTED',
  'PENDING',
  'READY',
  'RETRY_SCHEDULED',
  'FAILED'
);

CREATE TYPE "AppointmentMeetingOperation" AS ENUM (
  'CREATE_EVENT',
  'POLL_EVENT',
  'RETRY_CONFERENCE'
);

CREATE TYPE "AppointmentMeetingAttemptOutcome" AS ENUM (
  'PENDING',
  'READY',
  'FAILED'
);

ALTER TABLE "Appointment"
  ADD COLUMN "meetRequestId" TEXT,
  ADD COLUMN "meetGenerationStatus" "AppointmentMeetingGenerationStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "meetNextAttemptAt" TIMESTAMP(3);

UPDATE "Appointment"
SET
  "meetGenerationStatus" = CASE
    WHEN "status" = 'CONFIRMED' AND "meetLink" IS NOT NULL THEN 'READY'::"AppointmentMeetingGenerationStatus"
    WHEN "status" = 'MEETING_FAILED' THEN 'FAILED'::"AppointmentMeetingGenerationStatus"
    WHEN "status" = 'MEETING_PENDING' THEN 'PENDING'::"AppointmentMeetingGenerationStatus"
    ELSE 'NOT_STARTED'::"AppointmentMeetingGenerationStatus"
  END,
  "meetNextAttemptAt" = CASE
    WHEN "status" = 'MEETING_PENDING' THEN CURRENT_TIMESTAMP
    ELSE NULL
  END;

CREATE TABLE "AppointmentMeetingAttempt" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "operation" "AppointmentMeetingOperation" NOT NULL,
  "outcome" "AppointmentMeetingAttemptOutcome" NOT NULL,
  "requestId" TEXT,
  "googleEventId" TEXT,
  "providerStatus" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentMeetingAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_status_meetNextAttemptAt_idx"
  ON "Appointment"("status", "meetNextAttemptAt");

CREATE INDEX "AppointmentMeetingAttempt_appointmentId_createdAt_idx"
  ON "AppointmentMeetingAttempt"("appointmentId", "createdAt");

CREATE INDEX "AppointmentMeetingAttempt_outcome_createdAt_idx"
  ON "AppointmentMeetingAttempt"("outcome", "createdAt");

ALTER TABLE "AppointmentMeetingAttempt"
  ADD CONSTRAINT "AppointmentMeetingAttempt_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
