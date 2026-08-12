ALTER TABLE "TermsAcceptance"
ADD COLUMN "privacyPolicyVersion" TEXT NOT NULL DEFAULT 'privacy-v1.1';

ALTER TABLE "TermsAcceptance"
ALTER COLUMN "privacyPolicyVersion" DROP DEFAULT;
