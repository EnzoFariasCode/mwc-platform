/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[professionalId,date,time]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `time` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Appointment_professionalId_date_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "time" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_stripeSessionId_key" ON "Appointment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_professionalId_date_time_key" ON "Appointment"("professionalId", "date", "time");
