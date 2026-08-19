CREATE TABLE "ProjectResourceDirectory" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "submittedById" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectResourceDirectory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectResourceDirectory_projectId_key"
  ON "ProjectResourceDirectory"("projectId");

CREATE INDEX "ProjectResourceDirectory_submittedById_idx"
  ON "ProjectResourceDirectory"("submittedById");

ALTER TABLE "ProjectResourceDirectory"
  ADD CONSTRAINT "ProjectResourceDirectory_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectResourceDirectory"
  ADD CONSTRAINT "ProjectResourceDirectory_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
