ALTER TABLE "WithdrawalRequest"
ADD COLUMN "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "dueAt" TIMESTAMP(3),
ADD COLUMN "processedAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3),
ADD COLUMN "failureReason" TEXT,
ADD COLUMN "dueSoonNotifiedAt" TIMESTAMP(3),
ADD COLUMN "overdueNotifiedAt" TIMESTAMP(3);

UPDATE "WithdrawalRequest"
SET
  "requestedAt" = "createdAt",
  "dueAt" = "createdAt" + INTERVAL '12 days';

ALTER TABLE "WithdrawalRequest"
ALTER COLUMN "dueAt" SET NOT NULL;

CREATE INDEX "WithdrawalRequest_status_dueAt_idx"
ON "WithdrawalRequest"("status", "dueAt");
