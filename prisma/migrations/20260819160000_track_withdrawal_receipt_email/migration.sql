ALTER TABLE "WithdrawalRequest"
  ADD COLUMN "receiptEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "receiptEmailAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "receiptEmailFailureReason" TEXT;
