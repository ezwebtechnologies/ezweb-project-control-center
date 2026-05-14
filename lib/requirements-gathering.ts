import type { z } from "zod";
import {
  mergeRequirementsPricing,
  type RequirementsPricing,
} from "@/lib/requirements-pricing";
import { requirementsGatheringDataBodySchema } from "@/lib/validations";

export type RequirementsGatheringData = Omit<
  z.infer<typeof requirementsGatheringDataBodySchema>,
  "pricing"
> & { pricing: RequirementsPricing };

export const defaultRequirementsGatheringData = (): RequirementsGatheringData => ({
  pages: [],
  checklist: {
    notifications: false,
    integrations: false,
    clientDomain: false,
    googleBusinessProfile: false,
  },
  pricing: mergeRequirementsPricing(undefined),
});

export function parseRequirementsGatheringData(raw: unknown): RequirementsGatheringData {
  const r = requirementsGatheringDataBodySchema.safeParse(raw);
  if (!r.success) return defaultRequirementsGatheringData();
  return {
    ...r.data,
    pricing: mergeRequirementsPricing(r.data.pricing),
  };
}
