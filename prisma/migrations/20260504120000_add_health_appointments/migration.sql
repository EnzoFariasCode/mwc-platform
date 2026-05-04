-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "Industry" AS ENUM ('TECH', 'HEALTH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "industry" "Industry" NOT NULL DEFAULT 'TECH',
  ADD COLUMN IF NOT EXISTS "documentReg" TEXT,
  ADD COLUMN IF NOT EXISTS "approach" TEXT,
  ADD COLUMN IF NOT EXISTS "consultationFee" DECIMAL(65,30),
  ADD COLUMN IF NOT EXISTS "sessionDuration" INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "availability" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "meetLink" TEXT,
  "price" DECIMAL(65,30) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "patientId" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_professionalId_idx" ON "Appointment"("professionalId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_patientId_fkey'
  ) THEN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_professionalId_fkey'
  ) THEN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey"
      FOREIGN KEY ("professionalId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
