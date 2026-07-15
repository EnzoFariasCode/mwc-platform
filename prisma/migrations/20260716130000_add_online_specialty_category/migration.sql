-- Generalize the former English-only teacher category without replacing rows.
ALTER TYPE "HealthSpecialty" RENAME VALUE 'ENGLISH_TEACHER' TO 'TEACHER';

-- Persist the MWC Online category independently from the public job title.
ALTER TABLE "User" ADD COLUMN "onlineSpecialty" "HealthSpecialty";

UPDATE "User"
SET "onlineSpecialty" = CASE
  WHEN LOWER(COALESCE("jobTitle", '')) LIKE '%psicol%' THEN 'PSYCHOLOGIST'::"HealthSpecialty"
  WHEN LOWER(COALESCE("jobTitle", '')) LIKE '%nutri%' THEN 'NUTRITIONIST'::"HealthSpecialty"
  WHEN LOWER(COALESCE("jobTitle", '')) LIKE '%personal%'
    OR LOWER(COALESCE("jobTitle", '')) LIKE '%trainer%'
    OR LOWER(COALESCE("jobTitle", '')) LIKE '%educador f%'
    THEN 'PERSONAL_TRAINER'::"HealthSpecialty"
  WHEN LOWER(COALESCE("jobTitle", '')) LIKE '%advog%'
    OR LOWER(COALESCE("jobTitle", '')) LIKE '%jurid%'
    THEN 'LAWYER'::"HealthSpecialty"
  WHEN LOWER(COALESCE("jobTitle", '')) LIKE '%professor%'
    OR LOWER(COALESCE("jobTitle", '')) LIKE '%english%'
    OR LOWER(COALESCE("jobTitle", '')) LIKE '%ingl%'
    THEN 'TEACHER'::"HealthSpecialty"
  ELSE NULL
END
WHERE "userType" = 'PROFESSIONAL' AND "industry" = 'HEALTH';

-- Teachers are qualified by their teaching subject, not by a regulated council ID.
UPDATE "User"
SET "documentReg" = NULL
WHERE "onlineSpecialty" = 'TEACHER'::"HealthSpecialty";

CREATE INDEX "User_industry_userType_onlineSpecialty_isActive_idx"
ON "User"("industry", "userType", "onlineSpecialty", "isActive");
