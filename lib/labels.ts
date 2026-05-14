import type { PaymentStatus, ProjectPriority } from "@prisma/client";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";

export const projectStatusLabels: Record<ProjectLifecycleStage, string> = {
  INITIAL_DISCUSSION: "Initial Discussion",
  REQUIREMENTS_GATHERING: "Requirements Gathering",
  PROPOSAL_APPROVED: "Proposal",
  ADVANCE_PAYMENT_RECEIVED: "Advance Payment Received",
  UI_UX_DESIGN: "UI/UX Design",
  IN_DEVELOPMENT: "In Development",
  INTERNAL_TESTING: "Internal Testing",
  CLIENT_UAT: "Client UAT",
  REVISIONS: "Revisions",
  PROJECT_DELIVERED: "Project Delivered",
  PROJECT_CLOSED: "Project Closed",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  PARTIAL: "Partial",
};

export const projectPriorityLabels: Record<ProjectPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  OVERDUE: "Overdue",
};
