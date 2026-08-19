CREATE TYPE "ChatReportReason" AS ENUM (
  'HARASSMENT',
  'FRAUD',
  'SPAM',
  'EXTERNAL_PAYMENT',
  'INAPPROPRIATE_CONTENT',
  'THREAT',
  'OTHER'
);

CREATE TYPE "ChatReportStatus" AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'DISMISSED'
);

CREATE TYPE "ChatReportResolution" AS ENUM ('WARNING', 'NO_PENALTY');

CREATE TABLE "ChatReport" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reportedUserId" TEXT NOT NULL,
  "reason" "ChatReportReason" NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ChatReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" "ChatReportResolution",
  "resolutionReason" TEXT,
  "reportedThroughAt" TIMESTAMP(3) NOT NULL,
  "contextSnapshot" JSONB NOT NULL DEFAULT '{}',
  "isPriority" BOOLEAN NOT NULL DEFAULT false,
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "decisionNotifiedAt" TIMESTAMP(3),
  "decisionEmailError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedUserId" TEXT NOT NULL,
  "conversationId" TEXT,
  "sourceReportId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatReport_status_createdAt_idx" ON "ChatReport"("status", "createdAt");
CREATE INDEX "ChatReport_reporterId_createdAt_idx" ON "ChatReport"("reporterId", "createdAt");
CREATE INDEX "ChatReport_reportedUserId_status_idx" ON "ChatReport"("reportedUserId", "status");
CREATE INDEX "ChatReport_conversationId_reportedThroughAt_idx" ON "ChatReport"("conversationId", "reportedThroughAt");
CREATE UNIQUE INDEX "UserBlock_sourceReportId_key" ON "UserBlock"("sourceReportId");
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock"("blockerId", "blockedUserId");
CREATE INDEX "UserBlock_blockedUserId_blockerId_idx" ON "UserBlock"("blockedUserId", "blockerId");
CREATE INDEX "UserBlock_conversationId_idx" ON "UserBlock"("conversationId");

ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "ChatReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
