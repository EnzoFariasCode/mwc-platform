CREATE TABLE "CookieConsentEvent" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "userId" TEXT,
    "policyVersion" TEXT NOT NULL,
    "necessary" BOOLEAN NOT NULL DEFAULT true,
    "functionality" BOOLEAN NOT NULL,
    "analytics" BOOLEAN NOT NULL,
    "marketing" BOOLEAN NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CookieConsentEvent_consentId_createdAt_idx" ON "CookieConsentEvent"("consentId", "createdAt");
CREATE INDEX "CookieConsentEvent_userId_createdAt_idx" ON "CookieConsentEvent"("userId", "createdAt");
ALTER TABLE "CookieConsentEvent" ADD CONSTRAINT "CookieConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
