CREATE TABLE "WhatsappConsentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "phone" TEXT,
    "consentVersion" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsappConsentEvent_userId_createdAt_idx"
ON "WhatsappConsentEvent"("userId", "createdAt");

ALTER TABLE "WhatsappConsentEvent"
ADD CONSTRAINT "WhatsappConsentEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
