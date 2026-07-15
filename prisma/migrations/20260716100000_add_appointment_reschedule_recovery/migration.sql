ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULING';

CREATE TYPE "AppointmentRescheduleStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'RETRY_SCHEDULED',
  'RECONCILIATION_REQUIRED',
  'COMPLETED'
);

CREATE TYPE "AppointmentRescheduleStepStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'SKIPPED'
);

CREATE TABLE "AppointmentRescheduleProcess" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" "AppointmentRescheduleStatus" NOT NULL DEFAULT 'PENDING',
  "reservationId" TEXT,
  "previousDate" DATE NOT NULL,
  "previousTime" TEXT NOT NULL,
  "newDate" DATE NOT NULL,
  "newTime" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "calendarStatus" "AppointmentRescheduleStepStatus" NOT NULL DEFAULT 'PENDING',
  "calendarUpdatedAt" TIMESTAMP(3),
  "calendarLastError" TEXT,
  "databaseStatus" "AppointmentRescheduleStepStatus" NOT NULL DEFAULT 'PENDING',
  "databaseUpdatedAt" TIMESTAMP(3),
  "databaseLastError" TEXT,
  "reconciliationRequiredAt" TIMESTAMP(3),
  "reconciliationAlertedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "completionNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppointmentRescheduleProcess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentRescheduleProcess_reservationId_key"
  ON "AppointmentRescheduleProcess"("reservationId");
CREATE INDEX "AppointmentRescheduleProcess_appointmentId_createdAt_idx"
  ON "AppointmentRescheduleProcess"("appointmentId", "createdAt");
CREATE INDEX "AppointmentRescheduleProcess_status_nextAttemptAt_idx"
  ON "AppointmentRescheduleProcess"("status", "nextAttemptAt");
CREATE INDEX "AppointmentRescheduleProcess_processingStartedAt_idx"
  ON "AppointmentRescheduleProcess"("processingStartedAt");

ALTER TABLE "AppointmentRescheduleProcess"
  ADD CONSTRAINT "AppointmentRescheduleProcess_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AppointmentRescheduleProcess"
  ADD CONSTRAINT "AppointmentRescheduleProcess_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "AppointmentHold"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AppointmentRescheduleProcess"
  ADD CONSTRAINT "AppointmentRescheduleProcess_attemptCount_check"
  CHECK ("attemptCount" >= 0 AND "maxAttempts" BETWEEN 1 AND 10);
