import type { Metadata } from "next";
import { listClients } from "@/app/actions/clients";
import { listProjects } from "@/app/actions/projects";
import { ProjectsDirectory } from "@/components/projects/projects-directory";

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

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([listProjects(), listClients()]);
  const payload = projects.map((p) => ({
    id: p.id,
    name: p.name,
    deadline: p.deadline,
    status: p.status,
    client: p.client,
  }));
  const clientOpts = clients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    name: c.name,
  }));
  return (
    <ProjectsDirectory
      projects={JSON.parse(JSON.stringify(payload))}
      clients={JSON.parse(JSON.stringify(clientOpts))}
    />
  );
}
