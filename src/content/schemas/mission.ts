// Mission schema from MASTER Appendix B. P0 ships the schema with an empty
// mission set; P2 adds the first missions and the necessity verifier.
import { z } from 'zod';

const paramRange = z.object({ name: z.string(), min: z.number(), max: z.number(), step: z.number().positive().optional() });

export const MissionSchema = z.object({
  id: z.string().regex(/^R\d+-\d{2}$|^[A-Z]+-\d+$/),
  slug: z.string().min(1),
  version: z.number().int().positive(),
  realm: z.string().min(1),
  title: z.string().min(1),
  briefing: z.string().min(1),
  principles: z.array(z.string().min(1)).min(1),
  mode: z.enum(['One-Shot', 'Control', 'Build', 'Forensic', 'Chain', 'Futures', 'Daily']),
  difficulty: z.number().int().min(1).max(5),
  estimatedMinutes: z.number().positive(),
  scene: z.object({
    seed: z.number().int(),
    world: z.string().min(1),
    settings: z.record(z.string(), z.number()).optional(),
    entities: z.array(z.string()),
    allowedTools: z.array(z.string()),
    timeLimitS: z.number().positive().optional(),
  }),
  parameters: z.array(paramRange).optional(),
  randomised: z.array(paramRange).optional(),
  derived: z.array(z.object({ name: z.string(), expr: z.string(), unit: z.string().optional() })).optional(),
  attempts: z.number().int().positive(),
  runCost: z.number().min(0),
  objective: z.string().min(1),
  failConditions: z.array(z.string()).optional(),
  prediction: z.object({ type: z.string(), label: z.string(), unit: z.string().optional(), tolerance: z.number().positive() }).optional(),
  metrics: z.array(z.string()).optional(),
  stars: z.object({ objective: z.string(), efficiency: z.string(), insight: z.string() }),
  hints: z.array(z.string()).min(1),
  debrief: z.string().min(1),
  realWorld: z.object({ text: z.string(), source: z.string() }).optional(),
  modelCards: z.array(z.string()).min(1),
  solutions: z.object({
    reference: z.array(z.object({ approach: z.string(), solver: z.string() })).min(1),
    traps: z.array(z.object({ misconception: z.string(), solver: z.string() })).min(1),
  }),
  necessity: z.object({
    bot: z.string(),
    attempts: z.number().int().positive(),
    maxSuccessRate: z.number().min(0).max(1),
    separating: z.object({ quantity: z.string(), benches: z.array(z.string()) }),
  }),
});

export type Mission = z.infer<typeof MissionSchema>;
