import { z } from 'zod';

const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const quat = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const BodyDefSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['fixed', 'dynamic']),
  shape: z.enum(['cuboid', 'ball']),
  halfExtents: vec3.optional(),
  radius: z.number().positive().optional(),
  position: vec3,
  rotation: quat.optional(),
  linvel: vec3.optional(),
  angvel: vec3.optional(),
  density: z.number().positive().optional(),
  friction: z.number().min(0).optional(),
  restitution: z.number().min(0).max(1).optional(),
});

export const SceneDefSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  gravity: vec3,
  dt: z.number().positive().optional(),
  mechanicsSubsteps: z.number().int().positive().optional(),
  bodies: z.array(BodyDefSchema).min(1),
});
