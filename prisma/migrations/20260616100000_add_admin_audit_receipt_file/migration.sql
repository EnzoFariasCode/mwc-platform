-- AlterTable
ALTER TABLE "AdminAuditLog"
ADD COLUMN "receiptFileBytes" BYTEA,
ADD COLUMN "receiptFileType" TEXT,
ADD COLUMN "receiptFileName" TEXT;
