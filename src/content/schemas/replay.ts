// Replay file schema (MASTER 5.5). Validated at every boundary: files, share links, test API.
import { z } from 'zod';

const hex16 = z.string().regex(/^[0-9a-f]{16}$/, 'FNV-1a 64 hash as 16 lower-case hex characters');

export const InputCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('impulse'), tick: z.number().int().nonnegative(), entity: z.number().int().positive(), ix: z.number(), iy: z.number(), iz: z.number() }),
  z.object({ type: z.literal('nudge'), tick: z.number().int().nonnegative(), entity: z.number().int().positive(), dx: z.number(), dy: z.number(), dz: z.number() }),
  z.object({ type: z.literal('wake'), tick: z.number().int().nonnegative(), entity: z.number().int().positive() }),
]);

export const ReplayFileSchema = z.object({
  format: z.literal(1),
  gameVersion: z.string(),
  physicsVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  scene: z.object({ id: z.string().min(1), version: z.number().int().positive() }),
  seed: z.number().int(),
  dt: z.number().positive(),
  mechanicsSubsteps: z.number().int().positive(),
  ticks: z.number().int().positive(),
  inputs: z.array(InputCommandSchema),
  hashEvery: z.number().int().positive(),
  hashes: z.array(z.object({ tick: z.number().int().positive(), hash: hex16 })),
});

export type ReplayFileInput = z.input<typeof ReplayFileSchema>;
