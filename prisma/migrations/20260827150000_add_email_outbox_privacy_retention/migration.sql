-- Retain operational/idempotency metadata while allowing personal payloads to
-- be removed after the configured retention period.
ALTER TABLE "EmailOutbox" ADD COLUMN "redactedAt" TIMESTAMP(3);

CREATE INDEX "EmailOutbox_status_redactedAt_updatedAt_idx"
ON "EmailOutbox"("status", "redactedAt", "updatedAt");

-- One-time minimization for health e-mails that may already be waiting in the
-- queue. Free-text reasons remain available only in the authenticated domain.
UPDATE "EmailOutbox"
SET "payload" = jsonb_set(
  "payload",
  '{lines}',
  COALESCE(
    (
      SELECT jsonb_agg(line)
      FROM jsonb_array_elements("payload"->'lines') AS line
      WHERE lower(trim(both '"' from line::text)) NOT LIKE 'motivo:%'
    ),
    '[]'::jsonb
  )
)
WHERE "eventType" IN ('HEALTH_APPOINTMENT_CANCELED', 'HEALTH_REFUND_PROCESSED')
  AND jsonb_typeof("payload"->'lines') = 'array';

UPDATE "EmailOutbox"
SET "payload" = jsonb_set(
  "payload",
  '{details}',
  COALESCE(
    (
      SELECT jsonb_agg(detail)
      FROM jsonb_array_elements("payload"->'details') AS detail
      WHERE lower(detail->>'label') NOT IN ('motivo', 'paciente', 'profissional')
    ),
    '[]'::jsonb
  )
)
WHERE "eventType" LIKE 'ADMIN_HEALTH_DISPUTE_%'
  AND jsonb_typeof("payload"->'details') = 'array';
