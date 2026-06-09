-- CreateTable
CREATE TABLE "ProfessionalTermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL DEFAULT 'professional-v1.0',
    "userAgent" TEXT,

    CONSTRAINT "ProfessionalTermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalTermsAcceptance_userId_idx" ON "ProfessionalTermsAcceptance"("userId");

-- AddForeignKey
ALTER TABLE "ProfessionalTermsAcceptance" ADD CONSTRAINT "ProfessionalTermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
