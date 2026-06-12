-- AlterTable
ALTER TABLE "ClientRecord" ADD COLUMN     "englishBillingAmount" DECIMAL(65,30),
ADD COLUMN     "englishClassDuration" TEXT,
ADD COLUMN     "englishClassFrequency" TEXT,
ADD COLUMN     "englishClassMode" TEXT,
ADD COLUMN     "englishCurrentLevel" TEXT,
ADD COLUMN     "englishInitialDifficulties" TEXT,
ADD COLUMN     "englishMainGoal" TEXT,
ADD COLUMN     "englishPreviousExperience" TEXT;
