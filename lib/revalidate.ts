import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

export function revalidateProject(projectId?: string | null) {
  revalidateTag(cacheTags.dashboard);
  revalidateTag(cacheTags.projectsList);
  revalidateTag(cacheTags.paymentsWorkspace);
  if (projectId) revalidateTag(cacheTags.project(projectId));
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export function revalidateClient(clientId?: string | null) {
  revalidateTag(cacheTags.dashboard);
  revalidateTag(cacheTags.clientsList);
  if (clientId) revalidateTag(cacheTags.client(clientId));
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export function revalidatePayment(projectId?: string | null) {
  revalidateTag(cacheTags.dashboard);
  revalidateTag(cacheTags.paymentsWorkspace);
  if (projectId) {
    revalidateTag(cacheTags.project(projectId));
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}

export function revalidateExpense() {
  revalidateTag(cacheTags.dashboard);
  revalidateTag(cacheTags.expenses);
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}

export function revalidateEmployees() {
  revalidateTag(cacheTags.employeesList);
  revalidatePath("/employees");
}
