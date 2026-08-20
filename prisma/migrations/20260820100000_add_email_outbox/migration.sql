CREATE TYPE "EmailOutboxStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'REQUIRES_ATTENTION',
  'CANCELED'
);

CREATE TYPE "EmailDeliveryAttemptOutcome" AS ENUM (
  'PROCESSING',
  'SENT',
  'FAILED'
);

CREATE TABLE "EmailOutbox" (
  "id" TEXT NOT NULL,
  "idempotencyKey" VARCHAR(255) NOT NULL,
  "eventType" VARCHAR(100) NOT NULL,
  "templateKey" VARCHAR(100) NOT NULL,
  "templateVersion" INTEGER NOT NULL DEFAULT 1,
  "recipientUserId" TEXT,
  "recipientEmail" VARCHAR(320) NOT NULL,
  "recipientName" VARCHAR(160),
  "entityType" VARCHAR(100),
  "entityId" VARCHAR(191),
  "payload" JSONB NOT NULL DEFAULT '{}',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "providerMessageId" VARCHAR(191),
  "lastProviderStatusCode" INTEGER,
  "lastErrorCode" VARCHAR(100),
  "lastErrorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "requiresAttentionAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailOutbox_templateVersion_check" CHECK ("templateVersion" >= 1),
  CONSTRAINT "EmailOutbox_priority_check" CHECK ("priority" BETWEEN 0 AND 1000),
  CONSTRAINT "EmailOutbox_attemptCount_check" CHECK ("attemptCount" >= 0),
  CONSTRAINT "EmailOutbox_maxAttempts_check" CHECK ("maxAttempts" BETWEEN 1 AND 20)
);

CREATE TABLE "EmailDeliveryAttempt" (
  "id" TEXT NOT NULL,
  "emailOutboxId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "outcome" "EmailDeliveryAttemptOutcome" NOT NULL DEFAULT 'PROCESSING',
  "providerMessageId" VARCHAR(191),
  "providerStatusCode" INTEGER,
  "errorCode" VARCHAR(100),
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailDeliveryAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailDeliveryAttempt_attemptNumber_check" CHECK ("attemptNumber" >= 1)
);

CREATE UNIQUE INDEX "EmailOutbox_idempotencyKey_key"
  ON "EmailOutbox"("idempotencyKey");

CREATE UNIQUE INDEX "EmailOutbox_providerMessageId_key"
  ON "EmailOutbox"("providerMessageId");

CREATE INDEX "EmailOutbox_status_nextAttemptAt_priority_idx"
  ON "EmailOutbox"("status", "nextAttemptAt", "priority");

CREATE INDEX "EmailOutbox_status_processingStartedAt_idx"
  ON "EmailOutbox"("status", "processingStartedAt");

CREATE INDEX "EmailOutbox_eventType_createdAt_idx"
  ON "EmailOutbox"("eventType", "createdAt");

CREATE INDEX "EmailOutbox_entityType_entityId_idx"
  ON "EmailOutbox"("entityType", "entityId");

CREATE INDEX "EmailOutbox_recipientUserId_createdAt_idx"
  ON "EmailOutbox"("recipientUserId", "createdAt");

CREATE UNIQUE INDEX "EmailDeliveryAttempt_emailOutboxId_attemptNumber_key"
  ON "EmailDeliveryAttempt"("emailOutboxId", "attemptNumber");

CREATE INDEX "EmailDeliveryAttempt_outcome_createdAt_idx"
  ON "EmailDeliveryAttempt"("outcome", "createdAt");

CREATE INDEX "EmailDeliveryAttempt_providerMessageId_idx"
  ON "EmailDeliveryAttempt"("providerMessageId");

ALTER TABLE "EmailOutbox"
  ADD CONSTRAINT "EmailOutbox_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailDeliveryAttempt"
  ADD CONSTRAINT "EmailDeliveryAttempt_emailOutboxId_fkey"
  FOREIGN KEY ("emailOutboxId") REFERENCES "EmailOutbox"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
