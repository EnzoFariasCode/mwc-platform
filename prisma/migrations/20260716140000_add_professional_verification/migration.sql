CREATE TYPE "ProfessionalVerificationStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'UNDER_REVIEW',
  'CHANGES_REQUIRED',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'EXPIRED'
);

CREATE TYPE "ProfessionalCouncil" AS ENUM (
  'CRP',
  'CRN',
  'CREF',
  'OAB',
  'NOT_APPLICABLE'
);

CREATE TYPE "ProfessionalVerificationDocumentType" AS ENUM (
  'IDENTITY_DOCUMENT',
  'PROFESSIONAL_CREDENTIAL',
  'QUALIFICATION_DOCUMENT'
);

CREATE TYPE "ProfessionalRegistryCheckResult" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'NOT_FOUND',
  'INCONCLUSIVE',
  'NOT_APPLICABLE'
);

CREATE TABLE "ProfessionalVerification" (
  "id" TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "specialty" "HealthSpecialty" NOT NULL,
  "status" "ProfessionalVerificationStatus" NOT NULL DEFAULT 'DRAFT',
  "council" "ProfessionalCouncil" NOT NULL,
  "registrationNumber" TEXT,
  "registrationRegion" TEXT,
  "qualificationTitle" TEXT,
  "officialSourceUrl" TEXT,
  "officialCheckResult" "ProfessionalRegistryCheckResult",
  "officialCheckedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewerId" TEXT,
  "reviewReason" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "privacyAcceptedAt" TIMESTAMP(3),
  "privacyTermsVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfessionalVerificationDocument" (
  "id" TEXT NOT NULL,
  "verificationId" TEXT NOT NULL,
  "type" "ProfessionalVerificationDocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalVerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfessionalVerification_professionalId_key"
  ON "ProfessionalVerification"("professionalId");
CREATE INDEX "ProfessionalVerification_status_submittedAt_idx"
  ON "ProfessionalVerification"("status", "submittedAt");
CREATE INDEX "ProfessionalVerification_specialty_status_idx"
  ON "ProfessionalVerification"("specialty", "status");
CREATE INDEX "ProfessionalVerification_reviewerId_idx"
  ON "ProfessionalVerification"("reviewerId");
CREATE UNIQUE INDEX "ProfessionalVerificationDocument_verificationId_type_key"
  ON "ProfessionalVerificationDocument"("verificationId", "type");
CREATE INDEX "ProfessionalVerificationDocument_verificationId_idx"
  ON "ProfessionalVerificationDocument"("verificationId");

ALTER TABLE "ProfessionalVerification"
  ADD CONSTRAINT "ProfessionalVerification_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalVerification"
  ADD CONSTRAINT "ProfessionalVerification_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProfessionalVerificationDocument"
  ADD CONSTRAINT "ProfessionalVerificationDocument_verificationId_fkey"
  FOREIGN KEY ("verificationId") REFERENCES "ProfessionalVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProfessionalVerification" (
  "id",
  "professionalId",
  "specialty",
  "status",
  "council",
  "registrationNumber",
  "qualificationTitle",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-' || "id",
  "id",
  "onlineSpecialty",
  'DRAFT'::"ProfessionalVerificationStatus",
  CASE "onlineSpecialty"
    WHEN 'PSYCHOLOGIST' THEN 'CRP'::"ProfessionalCouncil"
    WHEN 'NUTRITIONIST' THEN 'CRN'::"ProfessionalCouncil"
    WHEN 'PERSONAL_TRAINER' THEN 'CREF'::"ProfessionalCouncil"
    WHEN 'LAWYER' THEN 'OAB'::"ProfessionalCouncil"
    ELSE 'NOT_APPLICABLE'::"ProfessionalCouncil"
  END,
  CASE WHEN "onlineSpecialty" = 'TEACHER' THEN NULL ELSE "documentReg" END,
  CASE WHEN "onlineSpecialty" = 'TEACHER' THEN "teachingSubject" ELSE NULL END,
  NOW(),
  NOW()
FROM "User"
WHERE "userType" = 'PROFESSIONAL'
  AND "industry" = 'HEALTH'
  AND "onlineSpecialty" IS NOT NULL
ON CONFLICT ("professionalId") DO NOTHING;
