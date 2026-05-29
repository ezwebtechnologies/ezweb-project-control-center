export const cacheTags = {
  dashboard: "dashboard",
  projectsList: "projects:list",
  project: (id: string) => `project:${id}`,
  clientsList: "clients:list",
  client: (id: string) => `client:${id}`,
  paymentsWorkspace: "payments:workspace",
  expenses: "expenses",
  employeesList: "employees:list",
} as const;
