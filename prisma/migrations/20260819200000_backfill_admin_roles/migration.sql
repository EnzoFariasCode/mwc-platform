UPDATE "User"
SET "adminRole" = 'OWNER'::"AdminRole"
WHERE "userType" = 'ADMIN'::"UserType"
  AND "adminRole" IS NULL;
