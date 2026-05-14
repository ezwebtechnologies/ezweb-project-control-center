import { cache } from "react";
import { prisma } from "@/lib/prisma";

let legacyProjectStatusRepairAttempted = false;

const NEW_PROJECT_STATUS_LABELS = [
  "INITIAL_DISCUSSION",
  "REQUIREMENTS_GATHERING",
  "PROPOSAL_APPROVED",
  "ADVANCE_PAYMENT_RECEIVED",
  "UI_UX_DESIGN",
  "IN_DEVELOPMENT",
  "INTERNAL_TESTING",
  "CLIENT_UAT",
  "REVISIONS",
  "PROJECT_DELIVERED",
  "PROJECT_CLOSED",
] as const;

async function ensurePostgresProjectStatusHasNewLabels(): Promise<void> {
  for (const label of NEW_PROJECT_STATUS_LABELS) {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS '${label}';`
    );
  }
}

async function repairLegacyProjectStatusesIfNeededImpl(): Promise<void> {
  if (legacyProjectStatusRepairAttempted) return;

  try {
    await ensurePostgresProjectStatusHasNewLabels();

    await prisma.$executeRawUnsafe(`
UPDATE "Project" AS p
SET status = (
  CASE p.status::text
    WHEN 'LEAD' THEN 'INITIAL_DISCUSSION'::"ProjectStatus"
    WHEN 'DISCUSSIONS' THEN 'REQUIREMENTS_GATHERING'::"ProjectStatus"
    WHEN 'QUOTE_FINALIZED' THEN 'PROPOSAL_APPROVED'::"ProjectStatus"
    WHEN 'DEVELOPMENT' THEN 'IN_DEVELOPMENT'::"ProjectStatus"
    WHEN 'CLIENT_TESTING' THEN 'CLIENT_UAT'::"ProjectStatus"
    WHEN 'DELIVERED' THEN 'PROJECT_DELIVERED'::"ProjectStatus"
    ELSE p.status
  END
)
WHERE p.status::text IN (
  'LEAD',
  'DISCUSSIONS',
  'QUOTE_FINALIZED',
  'DEVELOPMENT',
  'CLIENT_TESTING',
  'DELIVERED'
);
`);
    legacyProjectStatusRepairAttempted = true;
  } catch (e) {
    console.warn("[repair-legacy-project-status] migration SQL failed:", e);
  }
}

/** Dedupes within a single request; module flag skips work after first success. */
export const repairLegacyProjectStatusesIfNeeded = cache(
  repairLegacyProjectStatusesIfNeededImpl
);
