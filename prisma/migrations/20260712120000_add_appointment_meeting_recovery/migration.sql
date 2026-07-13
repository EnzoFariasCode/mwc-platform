ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'MEETING_PENDING';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'MEETING_FAILED';

ALTER TABLE "Appointment"
ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN "meetRetryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "meetProcessingStartedAt" TIMESTAMP(3),
ADD COLUMN "meetLastAttemptAt" TIMESTAMP(3),
ADD COLUMN "meetLastError" TEXT,
ADD COLUMN "meetingFailedAt" TIMESTAMP(3),
ADD COLUMN "meetingRefundId" TEXT;

CREATE INDEX "Appointment_status_meetLastAttemptAt_idx"
ON "Appointment"("status", "meetLastAttemptAt");
