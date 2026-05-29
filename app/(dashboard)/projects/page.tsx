import type { Metadata } from "next";
import { listClients } from "@/app/actions/clients";
import { listEmployees } from "@/app/actions/employees";
import { listProjects } from "@/app/actions/projects";
import { ProjectsDirectory } from "@/components/projects/projects-directory";
import { getCurrentUser } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Create and track delivery projects with clients, schedules, and automatic deadline-based priority.",
  keywords: [
    "projects",
    "project management",
    "MuleSoft delivery",
    "client projects",
    "deadlines",
  ],
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects | Control center",
    description:
      "Create projects, assign existing clients, and manage schedules with automatic priority from deadlines.",
    url: "/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Control center",
    description:
      "Create projects, assign existing clients, and manage schedules with automatic priority from deadlines.",
  },
};

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  // Creating a project requires picking a client, so only people who can see
  // clients (Sales, Managers, Admins) may create. Developers work assigned only.
  const canCreate = user?.permissions.viewClients ?? false;
  const [projects, clients, employees] = await Promise.all([
    listProjects(),
    canCreate ? listClients() : Promise.resolve([]),
    canCreate ? listEmployees() : Promise.resolve([]),
  ]);
  const payload = projects.map((p) => ({
    id: p.id,
    name: p.name,
    deadline: toIso(p.deadline),
    status: p.status,
    client: p.client,
    owner: p.createdBy?.name ?? null,
    assignees: p.assignees.map((a) => ({ id: a.id, name: a.name })),
  }));
  const clientOpts = clients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    name: c.name,
  }));
  const employeeOpts = employees.map((e) => ({ id: e.id, name: e.name }));
  return (
    <ProjectsDirectory
      projects={payload}
      clients={clientOpts}
      employees={employeeOpts}
      canCreate={canCreate}
    />
  );
}
