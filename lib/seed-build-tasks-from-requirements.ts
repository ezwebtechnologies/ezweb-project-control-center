import type { Prisma } from "@prisma/client";
import { parseRequirementsGatheringData } from "@/lib/requirements-gathering";

type Db = Prisma.TransactionClient;

export async function seedBuildTasksFromRequirements(
  db: Db,
  projectId: string,
  clientId: string,
  requirementsGatheringData: unknown
): Promise<void> {
  const existing = await db.task.count({
    where: { projectId, deletedAt: null },
  });
  if (existing > 0) return;

  const data = parseRequirementsGatheringData(requirementsGatheringData);
  const rows: Prisma.TaskCreateManyInput[] = [];
  let sortOrder = 0;

  for (const p of data.pages) {
    rows.push({
      title: p.title,
      description: p.description?.trim() ? p.description : null,
      projectId,
      clientId,
      sortOrder: sortOrder++,
    });
  }

  const checklist: { flag: boolean; title: string }[] = [
    { flag: data.checklist.clientDomain, title: "Domain (basic)" },
    { flag: data.checklist.googleBusinessProfile, title: "Google Business Profile" },
    { flag: data.checklist.notifications, title: "Notifications" },
    { flag: data.checklist.integrations, title: "Integrations" },
  ];
  for (const { flag, title } of checklist) {
    if (flag) {
      rows.push({
        title,
        projectId,
        clientId,
        sortOrder: sortOrder++,
      });
    }
  }

  if (rows.length === 0) return;
  await db.task.createMany({ data: rows });
}
