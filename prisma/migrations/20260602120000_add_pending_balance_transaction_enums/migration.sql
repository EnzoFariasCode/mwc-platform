-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pendingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction"
  ALTER COLUMN "type" TYPE "TransactionType" USING ("type"::"TransactionType"),
  ALTER COLUMN "status" TYPE "TransactionStatus" USING ("status"::"TransactionStatus");
