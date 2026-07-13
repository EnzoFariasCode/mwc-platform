-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "generalTermsVersion" TEXT NOT NULL,
    "industry" "Industry",
    "sectorTermsVersion" TEXT,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TermsAcceptance_sector_consistency_check" CHECK (
        ("industry" IS NULL AND "sectorTermsVersion" IS NULL) OR
        ("industry" IS NOT NULL AND "sectorTermsVersion" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "TermsAcceptance_userId_idx" ON "TermsAcceptance"("userId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_industry_sectorTermsVersion_idx" ON "TermsAcceptance"("industry", "sectorTermsVersion");

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
