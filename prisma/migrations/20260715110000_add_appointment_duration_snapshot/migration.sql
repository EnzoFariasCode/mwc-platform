ALTER TABLE "User"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

ALTER TABLE "Appointment"
ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 50;

UPDATE "Appointment" AS appointment
SET "durationMinutes" = COALESCE(professional."sessionDuration", 50)
FROM "User" AS professional
WHERE professional."id" = appointment."professionalId";

UPDATE "Appointment" AS appointment
SET "timezonePro" = professional."timezone"
FROM "User" AS professional
WHERE professional."id" = appointment."professionalId";

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_durationMinutes_check"
CHECK ("durationMinutes" > 0 AND "durationMinutes" <= 480);
