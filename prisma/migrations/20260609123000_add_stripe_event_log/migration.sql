-- CreateTable
CREATE TABLE "StripeEventLog" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeEventLog_stripeEventId_key" ON "StripeEventLog"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeEventLog_stripeEventId_idx" ON "StripeEventLog"("stripeEventId");
