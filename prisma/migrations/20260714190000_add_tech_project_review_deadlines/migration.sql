ALTER TABLE "Project"
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "cancellationProcessingAt" TIMESTAMP(3),
ADD COLUMN "reviewDeadlineAt" TIMESTAMP(3),
ADD COLUMN "reviewReminder3dSentAt" TIMESTAMP(3),
ADD COLUMN "reviewReminder1dSentAt" TIMESTAMP(3),
ADD COLUMN "autoReleasedAt" TIMESTAMP(3);

CREATE INDEX "Project_status_reviewDeadlineAt_idx"
ON "Project"("status", "reviewDeadlineAt");

UPDATE "Project" AS project
SET
  "deliveredAt" = delivery."createdAt",
  "reviewDeadlineAt" = delivery."createdAt" + INTERVAL '7 days'
FROM (
  SELECT DISTINCT ON ("projectId") "projectId", "createdAt"
  FROM "Deliverable"
  WHERE "link" IS NOT NULL
  ORDER BY "projectId", "createdAt" DESC
) AS delivery
WHERE project."id" = delivery."projectId"
  AND project."status" = 'UNDER_REVIEW';
