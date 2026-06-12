-- AlterTable
ALTER TABLE "ClientRecord" ADD COLUMN     "legalAddress" TEXT,
ADD COLUMN     "legalCnpj" TEXT,
ADD COLUMN     "legalCompanyName" TEXT,
ADD COLUMN     "legalContactEmail" TEXT,
ADD COLUMN     "legalContactPhones" TEXT,
ADD COLUMN     "legalCpf" TEXT,
ADD COLUMN     "legalMaritalStatus" TEXT,
ADD COLUMN     "legalNationality" TEXT,
ADD COLUMN     "legalPersonType" TEXT,
ADD COLUMN     "legalRepresentativeCpf" TEXT,
ADD COLUMN     "legalRepresentativeName" TEXT,
ADD COLUMN     "legalRg" TEXT,
ADD COLUMN     "legalStateRegistration" TEXT,
ADD COLUMN     "legalTradeName" TEXT;

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL,
    "clientRecordId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "legalArea" TEXT,
    "processNumber" TEXT,
    "court" TEXT,
    "clientPosition" TEXT,
    "opposingParty" TEXT,
    "opposingCounsel" TEXT,
    "factsSummary" TEXT,
    "feeType" TEXT,
    "feeDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCaseActivity" (
    "id" TEXT NOT NULL,
    "legalCaseId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "activityType" TEXT NOT NULL,
    "timeSpentMinutes" INTEGER,
    "description" TEXT NOT NULL,
    "deadlineDate" TIMESTAMP(3),
    "reminderDays" INTEGER,
    "filesNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCaseActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalCase_clientRecordId_idx" ON "LegalCase"("clientRecordId");

-- CreateIndex
CREATE INDEX "LegalCase_professionalId_idx" ON "LegalCase"("professionalId");

-- CreateIndex
CREATE INDEX "LegalCase_processNumber_idx" ON "LegalCase"("processNumber");

-- CreateIndex
CREATE INDEX "LegalCaseActivity_legalCaseId_idx" ON "LegalCaseActivity"("legalCaseId");

-- CreateIndex
CREATE INDEX "LegalCaseActivity_professionalId_idx" ON "LegalCaseActivity"("professionalId");

-- CreateIndex
CREATE INDEX "LegalCaseActivity_deadlineDate_idx" ON "LegalCaseActivity"("deadlineDate");

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_clientRecordId_fkey" FOREIGN KEY ("clientRecordId") REFERENCES "ClientRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCaseActivity" ADD CONSTRAINT "LegalCaseActivity_legalCaseId_fkey" FOREIGN KEY ("legalCaseId") REFERENCES "LegalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCaseActivity" ADD CONSTRAINT "LegalCaseActivity_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
