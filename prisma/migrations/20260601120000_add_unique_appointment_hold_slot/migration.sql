DO $$
BEGIN
  IF to_regclass('"AppointmentHold"') IS NOT NULL THEN
    DELETE FROM "AppointmentHold"
    WHERE "expiresAt" <= NOW();

    DELETE FROM "AppointmentHold" hold
    USING (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "professionalId", "date", "time"
          ORDER BY "expiresAt" DESC, "createdAt" DESC, id DESC
        ) AS row_number
      FROM "AppointmentHold"
    ) duplicate
    WHERE hold.id = duplicate.id
      AND duplicate.row_number > 1;

    DROP INDEX IF EXISTS "AppointmentHold_professionalId_date_time_idx";

    CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentHold_professionalId_date_time_key"
    ON "AppointmentHold"("professionalId", "date", "time");
  END IF;
END $$;
