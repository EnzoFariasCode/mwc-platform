DROP INDEX IF EXISTS "Appointment_professionalId_date_time_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_active_professional_date_time_key"
ON "Appointment"("professionalId", "date", "time")
WHERE "status" <> 'CANCELED';
