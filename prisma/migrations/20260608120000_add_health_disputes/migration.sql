-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "Appointment"
  ADD COLUMN "disputeReason" TEXT,
  ADD COLUMN "disputeOpenedAt" TIMESTAMP(3);
