-- CreateTable
CREATE TABLE "PaymentTermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "userAgent" TEXT,

    CONSTRAINT "PaymentTermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTermsAcceptance_userId_idx" ON "PaymentTermsAcceptance"("userId");

-- CreateIndex
CREATE INDEX "PaymentTermsAcceptance_stripeSessionId_idx" ON "PaymentTermsAcceptance"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "PaymentTermsAcceptance" ADD CONSTRAINT "PaymentTermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
