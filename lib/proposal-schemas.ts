import { z } from "zod";

import { buildProposalPricing } from "@/lib/proposals";

const optionalTrimmedString = z.string().trim().optional().default("");

const pricingAmountSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().nonnegative("Amount must be zero or greater").nullable());

const proposalBodySchema = z.object({
  client_id: z.string().uuid("Client is required"),
  lead_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, "Title is required"),
  service_type: optionalTrimmedString,
  problem: optionalTrimmedString,
  solution: optionalTrimmedString,
  scope: optionalTrimmedString,
  timeline: optionalTrimmedString,
  pricing_text: optionalTrimmedString,
  pricing_amount: pricingAmountSchema.optional().default(null),
  is_template: z.boolean().optional().default(false),
});

export const createProposalSchema = proposalBodySchema;

export const updateProposalSchema = z.object({
  client_id: z.string().uuid("Client is required").optional(),
  lead_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, "Title is required").optional(),
  service_type: z.string().trim().optional(),
  problem: z.string().trim().optional(),
  solution: z.string().trim().optional(),
  scope: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  pricing_text: z.string().trim().optional(),
  pricing_amount: pricingAmountSchema.optional(),
  is_template: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
  path: ["body"],
});

export function normalizeProposalInput(payload: Partial<z.infer<typeof proposalBodySchema>>) {
  const hasPricingFields = payload.pricing_text !== undefined || payload.pricing_amount !== undefined;
  return {
    ...(payload.client_id !== undefined ? { client_id: payload.client_id } : {}),
    ...(payload.lead_id !== undefined ? { lead_id: payload.lead_id ?? null } : {}),
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.service_type !== undefined ? { service_type: payload.service_type || null } : {}),
    ...(payload.problem !== undefined ? { problem: payload.problem || null } : {}),
    ...(payload.solution !== undefined ? { solution: payload.solution || null } : {}),
    ...(payload.scope !== undefined ? { scope: payload.scope || null } : {}),
    ...(payload.timeline !== undefined ? { timeline: payload.timeline || null } : {}),
    ...(hasPricingFields
      ? {
          pricing: buildProposalPricing(payload.pricing_text ?? "", payload.pricing_amount ?? null),
        }
      : {}),
    ...(payload.is_template !== undefined ? { is_template: payload.is_template } : {}),
  };
}

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;