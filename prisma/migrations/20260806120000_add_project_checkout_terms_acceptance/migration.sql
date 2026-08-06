ALTER TABLE "ProjectCheckoutHold"
ADD COLUMN "termsVersion" TEXT,
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsAcceptedIp" TEXT,
ADD COLUMN "termsAcceptedUserAgent" TEXT;
