-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_deletedAt_archivedAt_idx" ON "Project" ("deletedAt", "archivedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_projectId_deletedAt_idx" ON "Payment" ("projectId", "deletedAt");
