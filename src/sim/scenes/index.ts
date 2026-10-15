import type { SceneDef, BodyDef } from './types.ts';
import { Rng } from '../rng/index.ts';
import { CONSTANTS } from '../core/constants.ts';

export type { SceneDef, BodyDef } from './types.ts';

const G: readonly [number, number, number] = [0, -CONSTANTS.g0, 0];

/** P00 reference scene: a wooden cube tumbles onto a floor and settles. */
export const cubeDrop: SceneDef = {
  id: 'cube-drop',
  version: 1,
  gravity: G,
  bodies: [
    {
      name: 'floor',
      kind: 'fixed',
      shape: 'cuboid',
      halfExtents: [10, 0.25, 10],
      position: [0, -0.25, 0],
      friction: 0.6,
      restitution: 0.1,
    },
    {
      name: 'cube',
      kind: 'dynamic',
      shape: 'cuboid',
      halfExtents: [0.5, 0.5, 0.5],
      position: [0, 3, 0],
      // about 44 degrees around the (1, 1, 1) axis so it lands on an edge and tumbles
      rotation: [0.1830127, 0.1830127, 0.1830127, 0.9486833],
      angvel: [0.5, 0.2, -0.3],
      density: 700,
      friction: 0.6,
      restitution: 0.1,
    },
  ],
};

/** Bench M1: a small ball in free fall, no floor. */
export const freeFall: SceneDef = {
  id: 'free-fall',
  version: 1,
  gravity: G,
  bodies: [
    {
      name: 'ball',
      kind: 'dynamic',
      shape: 'ball',
      radius: 0.1,
      position: [0, 100, 0],
      density: 7800,
    },
  ],
};

export const SCENES: Readonly<Record<string, SceneDef>> = {
  [cubeDrop.id]: cubeDrop,
  [freeFall.id]: freeFall,
  'stack-1000': stackScene(1000),
};

export function getScene(id: string): SceneDef {
  const s = SCENES[id];
  if (s === undefined) throw new Error(`unknown scene: ${id}`);
  return s;
}

/**
 * Random drop scene for fuzzing: a floor plus up to maxBodies cuboids and
 * balls with random sizes, poses, velocities and materials. Pure function
 * of the seed.
 */
export function randomDropScene(seed: number, maxBodies = 12): SceneDef {
  const rng = new Rng(seed);
  const s = rng.stream('fuzz-scene');
  const n = 1 + s.int(maxBodies);
  const bodies: BodyDef[] = [
    {
      name: 'floor',
      kind: 'fixed',
      shape: 'cuboid',
      halfExtents: [20, 0.5, 20],
      position: [0, -0.5, 0],
      friction: s.range(0.1, 1.0),
      restitution: s.range(0, 0.5),
    },
  ];
  for (let i = 0; i < n; i++) {
    const ball = s.next() < 0.4;
    const size = s.range(0.05, 1.0);
    // random unit quaternion from four normals would need dmath; use a renormalised uniform sample
    let qx = s.range(-1, 1);
    let qy = s.range(-1, 1);
    let qz = s.range(-1, 1);
    let qw = s.range(-1, 1);
    const len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;
    qx /= len;
    qy /= len;
    qz /= len;
    qw /= len;
    bodies.push({
      name: `body-${i}`,
      kind: 'dynamic',
      shape: ball ? 'ball' : 'cuboid',
      ...(ball ? { radius: size * 0.5 } : { halfExtents: [size * s.range(0.3, 1), size * s.range(0.3, 1), size * s.range(0.3, 1)] as const }),
      position: [s.range(-3, 3), s.range(0.5, 8), s.range(-3, 3)],
      rotation: [qx, qy, qz, qw],
      linvel: [s.range(-3, 3), s.range(-3, 1), s.range(-3, 3)],
      angvel: [s.range(-5, 5), s.range(-5, 5), s.range(-5, 5)],
      density: s.range(200, 8000),
      friction: s.range(0.05, 1.2),
      restitution: s.range(0, 0.8),
    });
  }
  return { id: `fuzz-${seed}`, version: 1, gravity: G, bodies };
}

/**
 * Stack scene for spikes and stress: n unit cubes in a loose grid over a floor,
 * dropped from staggered heights so every body stays awake for a while.
 */
export function stackScene(n: number): SceneDef {
  const side = Math.ceil(Math.sqrt(n / 4));
  const bodies: BodyDef[] = [
    { name: 'floor', kind: 'fixed', shape: 'cuboid', halfExtents: [side * 1.5 + 5, 0.5, side * 1.5 + 5], position: [0, -0.5, 0], friction: 0.7, restitution: 0.05 },
  ];
  let i = 0;
  outer: for (let layer = 0; layer < 64; layer++) {
    for (let ix = 0; ix < side; ix++) {
      for (let iz = 0; iz < side; iz++) {
        if (i >= n) break outer;
        bodies.push({
          name: `cube-${i}`,
          kind: 'dynamic',
          shape: 'cuboid',
          halfExtents: [0.5, 0.5, 0.5],
          position: [(ix - side / 2) * 1.6 + (layer % 2) * 0.3, 0.6 + layer * 1.3, (iz - side / 2) * 1.6 + (layer % 3) * 0.2],
          density: 700,
          friction: 0.7,
          restitution: 0.05,
        });
        i++;
      }
    }
  }
  return { id: `stack-${n}`, version: 1, gravity: G, bodies };
}
