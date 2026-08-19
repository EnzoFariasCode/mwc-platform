ALTER TABLE "ProfessionalVerification"
  ADD COLUMN "decisionNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "decisionEmailError" TEXT,
  ADD COLUMN "decisionEmailAttempts" INTEGER NOT NULL DEFAULT 0;
