-- CreateEnum
CREATE TYPE "HealthSpecialty" AS ENUM ('PSYCHOLOGIST', 'NUTRITIONIST', 'PERSONAL_TRAINER', 'LAWYER', 'ENGLISH_TEACHER');

-- CreateTable
CREATE TABLE "ClientRecord" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "specialty" "HealthSpecialty" NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientEmail" TEXT,
    "patientPhone" TEXT,
    "patientBirth" TIMESTAMP(3),
    "patientGender" TEXT,
    "patientCity" TEXT,
    "chiefComplaint" TEXT,
    "generalNotes" TEXT,
    "specialtyData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionNote" (
    "id" TEXT NOT NULL,
    "clientRecordId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "professionalId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "evolution" TEXT,
    "nextSteps" TEXT,
    "privateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRecord_professionalId_idx" ON "ClientRecord"("professionalId");

-- CreateIndex
CREATE INDEX "ClientRecord_patientId_idx" ON "ClientRecord"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRecord_professionalId_patientId_key" ON "ClientRecord"("professionalId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionNote_appointmentId_key" ON "SessionNote"("appointmentId");

-- CreateIndex
CREATE INDEX "SessionNote_clientRecordId_idx" ON "SessionNote"("clientRecordId");

-- CreateIndex
CREATE INDEX "SessionNote_professionalId_idx" ON "SessionNote"("professionalId");

-- AddForeignKey
ALTER TABLE "ClientRecord" ADD CONSTRAINT "ClientRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRecord" ADD CONSTRAINT "ClientRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_clientRecordId_fkey" FOREIGN KEY ("clientRecordId") REFERENCES "ClientRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
