import { z } from 'zod';
const text = z.string().trim().min(1).max(1200);
const bullets = z.array(text).min(1).max(8);
export const sectors = [
  'Logistics',
  'Bioscience',
  'Pharmaceuticals',
  'Finance',
  'FinTech',
] as const;
export const questionGroups = [
  'Commercial',
  'Technical',
  'Operational',
  'Compliance',
] as const;
export const driverIds = [
  'integrations',
  'data-readiness',
  'sso',
  'compliance',
  'residency',
  'human-review',
] as const;
export const AssumptionSchema = z.object({
  text,
  confidence: z.enum(['High', 'Medium', 'Low']),
});
export const OpenQuestionSchema = z.object({
  group: z.enum(questionGroups),
  question: text,
  why: text,
});
export const PhaseSchema = z.object({
  name: text,
  objective: text,
  activities: z.array(text).min(3).max(5),
  exitCriteria: text,
  duration: z.object({
    min: z.number().int().min(1).max(12),
    max: z.number().int().min(1).max(16),
  }),
});
export const EffortInputSchema = z.object({
  size: z.enum(['Small', 'Medium', 'Large']),
  drivers: z.array(z.object({ id: z.enum(driverIds), detail: text })).max(6),
});
export const EffortBandSchema = EffortInputSchema.extend({
  min: z.number().min(1),
  max: z.number().min(1),
});
export const ScopeContentSchema = z.object({
  title: text,
  summary: text,
  customer: text,
  sector: z.enum(sectors),
  goals: z.array(text).min(3).max(5),
  inScope: bullets,
  outOfScope: bullets,
  assumptions: z.array(AssumptionSchema).min(3).max(8),
  questions: z
    .array(OpenQuestionSchema)
    .min(4)
    .max(12)
    .refine(
      (q) => questionGroups.every((g) => q.some((x) => x.group === g)),
      'Include all four question groups',
    ),
  phases: z.array(PhaseSchema).min(3).max(5),
  effort: EffortInputSchema,
  risks: z
    .array(z.object({ risk: text, mitigation: text }))
    .min(3)
    .max(5),
  metrics: z
    .array(z.object({ metric: text, target: text }))
    .min(3)
    .max(5),
});
export const ScopeSchema = ScopeContentSchema.extend({
  effort: EffortBandSchema,
}).refine(
  (s) =>
    s.effort.max >= s.effort.min &&
    s.phases.every((p) => p.duration.max >= p.duration.min),
  'Invalid range',
);
export const SectionSchema = z.enum([
  'overview',
  'goals',
  'boundaries',
  'assumptions',
  'questions',
  'phases',
  'effort',
  'risks',
  'metrics',
]);
export const BriefSchema = z.object({
  brief: z
    .string()
    .trim()
    .min(20, 'Add at least 20 characters to give us something to scope.')
    .max(12000),
  sector: z.enum(sectors).optional(),
  budget: z
    .enum([
      'Unspecified',
      'Lean pilot',
      'Department initiative',
      'Strategic programme',
    ])
    .default('Unspecified'),
  timeline: z
    .enum(['Exploratory', 'This quarter', 'ASAP'])
    .default('Exploratory'),
  sampleId: z.string().max(100).optional(),
  forceDemo: z.boolean().optional(),
  accessToken: z.string().max(256).optional(),
});
export const SectionRequestSchema = z.object({
  input: BriefSchema,
  scope: ScopeSchema,
  section: SectionSchema,
  alternate: z.boolean().default(false),
});
export type Scope = z.infer<typeof ScopeSchema>;
export type ScopeContent = z.infer<typeof ScopeContentSchema>;
export type BriefInput = z.infer<typeof BriefSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type ForgeResult = {
  scope: Scope;
  mode: 'demo' | 'live';
  source: 'fixture' | 'heuristic' | 'llm';
  notice: string;
  provider?: string;
};
export type SampleBrief = {
  id: string;
  sector: (typeof sectors)[number];
  customer: string;
  teaser: string;
  filename: string;
  brief: string;
};
