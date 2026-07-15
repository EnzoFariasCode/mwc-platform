CREATE TABLE "HealthAppointmentReview" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "hiddenAt" TIMESTAMP(3),
  "hiddenReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HealthAppointmentReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HealthAppointmentReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "HealthAppointmentReview_comment_length_check" CHECK (
    "comment" IS NULL OR char_length("comment") <= 1000
  )
);

CREATE UNIQUE INDEX "HealthAppointmentReview_appointmentId_key"
  ON "HealthAppointmentReview"("appointmentId");
CREATE INDEX "HealthAppointmentReview_professionalId_isVisible_createdAt_idx"
  ON "HealthAppointmentReview"("professionalId", "isVisible", "createdAt");
CREATE INDEX "HealthAppointmentReview_authorId_createdAt_idx"
  ON "HealthAppointmentReview"("authorId", "createdAt");

ALTER TABLE "HealthAppointmentReview"
  ADD CONSTRAINT "HealthAppointmentReview_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthAppointmentReview"
  ADD CONSTRAINT "HealthAppointmentReview_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthAppointmentReview"
  ADD CONSTRAINT "HealthAppointmentReview_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
