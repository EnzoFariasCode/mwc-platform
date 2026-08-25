-- CreateTable
CREATE TABLE "EmailOperationsHeartbeat" (
    "key" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "lastStartedAt" TIMESTAMP(3),
    "lastSucceededAt" TIMESTAMP(3),
    "lastFailedAt" TIMESTAMP(3),
    "lastDurationMs" INTEGER,
    "lastMetrics" JSONB NOT NULL DEFAULT '{}',
    "lastErrorCode" VARCHAR(100),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOperationsHeartbeat_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "EmailOperationsHeartbeat_lastSucceededAt_idx" ON "EmailOperationsHeartbeat"("lastSucceededAt");
