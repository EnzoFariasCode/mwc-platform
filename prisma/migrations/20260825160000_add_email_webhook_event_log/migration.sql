-- CreateEnum
CREATE TYPE "EmailWebhookEventStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailWebhookEventLog" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerEventId" VARCHAR(191) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "providerMessageId" VARCHAR(191),
    "status" "EmailWebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "processingStartedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastErrorCode" VARCHAR(100),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailWebhookEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailWebhookEventLog_provider_providerEventId_key" ON "EmailWebhookEventLog"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "EmailWebhookEventLog_status_processingStartedAt_idx" ON "EmailWebhookEventLog"("status", "processingStartedAt");

-- CreateIndex
CREATE INDEX "EmailWebhookEventLog_providerMessageId_createdAt_idx" ON "EmailWebhookEventLog"("providerMessageId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailWebhookEventLog_eventType_createdAt_idx" ON "EmailWebhookEventLog"("eventType", "createdAt");

-- AlterTable
ALTER TABLE "EmailOutbox" ADD COLUMN "retryOfId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_retryOfId_key" ON "EmailOutbox"("retryOfId");

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_retryOfId_fkey" FOREIGN KEY ("retryOfId") REFERENCES "EmailOutbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
