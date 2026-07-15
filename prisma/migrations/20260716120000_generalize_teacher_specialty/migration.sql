-- Store the teaching subject independently from regulated professional credentials.
ALTER TABLE "User" ADD COLUMN "teachingSubject" TEXT;

-- Existing teacher accounts came exclusively from the former English category.
UPDATE "User"
SET
  "jobTitle" = 'Professor',
  "teachingSubject" = 'Inglês'
WHERE
  "industry" = 'HEALTH'
  AND LOWER(BTRIM("jobTitle")) IN (
    'professor de ingles',
    'professor de inglês',
    'professor(a) de ingles',
    'professor(a) de inglês',
    'professora de ingles',
    'professora de inglês',
    'english teacher'
  );
