-- Link health financial transactions directly to appointments.
ALTER TABLE "Transaction" ADD COLUMN "appointmentId" TEXT;

UPDATE "Transaction" AS t
SET "appointmentId" = a."id"
FROM "Appointment" AS a
WHERE t."appointmentId" IS NULL
  AND a."stripeSessionId" IS NOT NULL
  AND t."description" LIKE '%' || a."stripeSessionId" || '%';

CREATE INDEX "Transaction_projectId_idx" ON "Transaction"("projectId");
CREATE INDEX "Transaction_appointmentId_idx" ON "Transaction"("appointmentId");
CREATE INDEX "Transaction_userId_status_idx" ON "Transaction"("userId", "status");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
