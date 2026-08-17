ALTER TYPE "BookingStatus"
  ADD VALUE IF NOT EXISTS 'MEETING_REQUIRES_ATTENTION';

ALTER TYPE "AppointmentMeetingGenerationStatus"
  ADD VALUE IF NOT EXISTS 'REQUIRES_ATTENTION';

ALTER TYPE "AppointmentMeetingOperation"
  ADD VALUE IF NOT EXISTS 'ADMIN_RETRY';

ALTER TYPE "AppointmentMeetingOperation"
  ADD VALUE IF NOT EXISTS 'MANUAL_LINK';

ALTER TABLE "Appointment"
  ADD COLUMN "meetAttentionRequiredAt" TIMESTAMP(3),
  ADD COLUMN "meetAttentionAlertedAt" TIMESTAMP(3);

CREATE INDEX "Appointment_status_meetAttentionRequiredAt_idx"
  ON "Appointment"("status", "meetAttentionRequiredAt");
