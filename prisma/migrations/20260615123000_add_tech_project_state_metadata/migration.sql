ALTER TABLE "Project" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "Project" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Project" ADD COLUMN "canceledAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "Project" ADD COLUMN "revisionRequestedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "revisionReason" TEXT;
ALTER TABLE "Project" ADD COLUMN "disputeReason" TEXT;
ALTER TABLE "Project" ADD COLUMN "disputeOpenedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "disputeResolvedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "disputeResolution" TEXT;

CREATE UNIQUE INDEX "Project_stripeSessionId_key" ON "Project"("stripeSessionId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_stripePaymentIntentId_idx" ON "Project"("stripePaymentIntentId");
