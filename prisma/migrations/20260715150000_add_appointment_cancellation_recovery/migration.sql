ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLING';

CREATE TYPE "AppointmentCancellationStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'RETRY_SCHEDULED',
  'RECONCILIATION_REQUIRED',
  'COMPLETED'
);

CREATE TYPE "AppointmentCancellationStepStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'SKIPPED'
);

CREATE TYPE "AppointmentCancellationInitiator" AS ENUM (
  'PATIENT',
  'PROFESSIONAL',
  'ADMIN',
  'SYSTEM'
);

CREATE TABLE "AppointmentCancellationProcess" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "initiator" "AppointmentCancellationInitiator" NOT NULL,
  "reason" TEXT,
  "status" "AppointmentCancellationStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "meetStatus" "AppointmentCancellationStepStatus" NOT NULL DEFAULT 'PENDING',
  "meetCanceledAt" TIMESTAMP(3),
  "meetLastError" TEXT,
  "refundStatus" "AppointmentCancellationStepStatus" NOT NULL DEFAULT 'PENDING',
  "refundId" TEXT,
  "refundedAt" TIMESTAMP(3),
  "refundLastError" TEXT,
  "escrowStatus" "AppointmentCancellationStepStatus" NOT NULL DEFAULT 'PENDING',
  "escrowCanceledAt" TIMESTAMP(3),
  "escrowLastError" TEXT,
  "reconciliationRequiredAt" TIMESTAMP(3),
  "reconciliationAlertedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "completionNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppointmentCancellationProcess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentCancellationProcess_appointmentId_key"
  ON "AppointmentCancellationProcess"("appointmentId");
CREATE INDEX "AppointmentCancellationProcess_status_nextAttemptAt_idx"
  ON "AppointmentCancellationProcess"("status", "nextAttemptAt");
CREATE INDEX "AppointmentCancellationProcess_processingStartedAt_idx"
  ON "AppointmentCancellationProcess"("processingStartedAt");

ALTER TABLE "AppointmentCancellationProcess"
  ADD CONSTRAINT "AppointmentCancellationProcess_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AppointmentCancellationProcess"
  ADD CONSTRAINT "AppointmentCancellationProcess_attemptCount_check"
  CHECK ("attemptCount" >= 0 AND "maxAttempts" BETWEEN 1 AND 10);
