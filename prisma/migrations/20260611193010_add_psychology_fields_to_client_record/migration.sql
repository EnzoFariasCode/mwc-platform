-- AlterTable
ALTER TABLE "ClientRecord" ADD COLUMN     "continuousMedications" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRel" TEXT,
ADD COLUMN     "familyHistory" TEXT,
ADD COLUMN     "fixedSessionDay" TEXT,
ADD COLUMN     "fixedSessionTime" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "previousTreatments" TEXT,
ADD COLUMN     "sessionFrequency" TEXT,
ADD COLUMN     "sessionValueAgreed" DECIMAL(65,30);
