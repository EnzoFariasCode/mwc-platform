/*
  Warnings:

  - A unique constraint covering the columns `[professionalId,date]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_professionalId_date_key" ON "Appointment"("professionalId", "date");
