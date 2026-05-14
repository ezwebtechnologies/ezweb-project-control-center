import { z } from "zod";

export const clientCreateSchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
});

export const clientUpdateSchema = clientCreateSchema.extend({
  id: z.string().uuid(),
});

export const projectCreateSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  startDate: z.string().max(40).optional().nullable(),
  deadline: z.string().max(40).optional().nullable(),
  tags: z.array(z.string().max(64)).max(20).default([]),
});

export const projectCreateStrictSchema = projectCreateSchema.extend({
  deadline: z.string().min(1, "Deadline is required").max(40),
});

export const projectCreateFormSchema = projectCreateStrictSchema.omit({ tags: true });

export const projectUpdateFormSchema = projectCreateFormSchema.extend({
  id: z.string().uuid(),
});

export const projectFormInputSchema = projectCreateSchema
  .omit({ tags: true })
  .extend({
    tagsInput: z.string().optional(),
  });

export type ProjectFormInput = z.infer<typeof projectFormInputSchema>;

export const projectUpdateSchema = projectCreateSchema.extend({
  id: z.string().uuid(),
});

export const requirementsGatheringPageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(240),
  description: z.string().max(8000),
});

export const requirementsGatheringPricingSchema = z.object({
  perPage: z.number().int().min(0).max(9_999_999),
  domain: z.number().int().min(0).max(9_999_999),
  googleBusiness: z.number().int().min(0).max(9_999_999),
  notifications: z.number().int().min(0).max(9_999_999),
  integrations: z.number().int().min(0).max(9_999_999),
  discountInr: z.number().int().min(0).max(9_999_999).optional(),
});

export const requirementsGatheringDataBodySchema = z.object({
  pages: z.array(requirementsGatheringPageSchema).max(80),
  checklist: z.object({
    notifications: z.boolean(),
    integrations: z.boolean(),
    clientDomain: z.boolean(),
    googleBusinessProfile: z.boolean(),
  }),
  pricing: requirementsGatheringPricingSchema.optional(),
});

export const requirementsGatheringAdvanceSchema = z.object({
  projectId: z.string().uuid(),
  pages: z.array(requirementsGatheringPageSchema).max(80),
  checklist: z.object({
    notifications: z.boolean(),
    integrations: z.boolean(),
    clientDomain: z.boolean(),
    googleBusinessProfile: z.boolean(),
  }),
  advanceToProposal: z.literal(true),
});

export const proposalPricingSaveSchema = z.object({
  projectId: z.string().uuid(),
  pricing: requirementsGatheringPricingSchema,
});

export type ProposalPricingSaveInput = z.infer<typeof proposalPricingSaveSchema>;

export const sendQuotationEmailSchema = z.object({
  projectId: z.string().uuid(),
  to: z.string().email().max(320),
  pricing: requirementsGatheringPricingSchema.optional(),
});

export type SendQuotationEmailInput = z.infer<typeof sendQuotationEmailSchema>;

export const advancePaymentSubmitSchema = z.object({
  projectId: z.string().uuid(),
  advanceAmount: z.coerce.number().finite().min(0).max(1_000_000_000),
});

export type AdvancePaymentSubmitInput = z.infer<typeof advancePaymentSubmitSchema>;

export const projectTaskStatusUpdateSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export const clientUatIssueStatusSchema = z.enum(["open", "in_progress", "completed"]);

export const clientUatIssueSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(320),
  description: z.string().max(2000).optional().nullable(),
  status: clientUatIssueStatusSchema,
});

export const clientUatPayloadSchema = z.object({
  projectId: z.string().uuid(),
  issues: z.array(clientUatIssueSchema).max(80),
  outcomes: z.string().max(8000).optional().nullable(),
});

export type ClientUatPayloadInput = z.infer<typeof clientUatPayloadSchema>;

export const paymentCreateSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.string().length(3).default("INR"),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "PARTIAL"]),
  invoiceNumber: z.string().max(120).optional().nullable(),
  paymentDate: z.string().max(40).optional().nullable(),
  dueDate: z.string().max(40).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

export const paymentUpdateSchema = paymentCreateSchema.extend({
  id: z.string().uuid(),
});

export const expenseCreateSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.string().length(3).default("INR"),
  description: z.string().min(1).max(2000),
  incurredAt: z.string().min(1).max(40),
});

export const revisionApprovalsSaveSchema = z.object({
  projectId: z.string().uuid(),
  revisionApprovals: z
    .record(z.string(), z.enum(["pending", "approved", "rejected"]))
    .refine((r) => Object.keys(r).length <= 80, "Too many entries."),
});

export type RevisionApprovalsSaveInput = z.infer<typeof revisionApprovalsSaveSchema>;

export const postDeliveryHypercareSaveSchema = z.object({
  projectId: z.string().uuid(),
  hypercare: z.record(z.string(), z.boolean()).refine((r) => Object.keys(r).length <= 32, "Too many entries."),
});

export type PostDeliveryHypercareSaveInput = z.infer<typeof postDeliveryHypercareSaveSchema>;
