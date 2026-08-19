ALTER TABLE "Project"
  ADD COLUMN "disputeDecisionClaim" TEXT,
  ADD COLUMN "disputeDecisionClaimedAt" TIMESTAMP(3),
  ADD COLUMN "disputeDecisionClaimedBy" TEXT;

ALTER TABLE "Appointment"
  ADD COLUMN "disputeDecisionClaim" TEXT,
  ADD COLUMN "disputeDecisionClaimedAt" TIMESTAMP(3),
  ADD COLUMN "disputeDecisionClaimedBy" TEXT;

CREATE INDEX "Project_disputeDecisionClaim_idx"
  ON "Project"("disputeDecisionClaim");

CREATE INDEX "Appointment_disputeDecisionClaim_idx"
  ON "Appointment"("disputeDecisionClaim");
