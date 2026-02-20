import { z } from 'zod';

export const AcceptanceCriterionSchema = z.object({
  description: z.string(),
  predicate: z.string().optional(),
});

const VALID_STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;

export const PrdStorySchema = z.object({
  id: z.string(),
  phase: z.number().int().positive(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  title: z.string(),
  description: z.string(),
  module: z.string().optional(),
  storyPoints: z.number().refine(
    (val): val is (typeof VALID_STORY_POINTS)[number] =>
      (VALID_STORY_POINTS as readonly number[]).includes(val),
    { message: 'storyPoints must be a Fibonacci number: 1, 2, 3, 5, 8, or 13' },
  ),
  dependencies: z.array(z.string()),
  acceptanceCriteria: z.array(AcceptanceCriterionSchema),
  passes: z.boolean(),
});

const PrdPhaseSchema = z.object({
  phase: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
});

export const PrdSchema = z.object({
  version: z.string(),
  project: z.string(),
  generatedAt: z.string().optional(),
  phases: z.array(PrdPhaseSchema).optional(),
  stories: z.array(PrdStorySchema),
});

export type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;
export type PrdStory = z.infer<typeof PrdStorySchema>;
export type PrdPhase = z.infer<typeof PrdPhaseSchema>;
export type Prd = z.infer<typeof PrdSchema>;
