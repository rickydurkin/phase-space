// Replay files: seed, scene, tick, input log and periodic hashes (MASTER 5.5).
// The zod schema lives at the content boundary (src/content/schemas/replay.ts);
// this module holds the types and the runner.

import type { InputCommand } from './types.ts';
import { Simulation } from './simulation.ts';
import { getScene } from '../scenes/index.ts';
import type { SceneDef } from '../scenes/types.ts';
import { PHYSICS_VERSION, REPLAY_FORMAT } from '../version.ts';

export interface HashSample {
  readonly tick: number;
  readonly hash: string;
}

export interface ReplayFile {
  readonly format: number;
  readonly gameVersion: string;
  readonly physicsVersion: string;
  readonly scene: { readonly id: string; readonly version: number };
  readonly seed: number;
  readonly dt: number;
  readonly mechanicsSubsteps: number;
  readonly ticks: number;
  readonly inputs: readonly InputCommand[];
  /** Hashes recorded every hashEvery ticks, plus the final tick. */
  readonly hashEvery: number;
  readonly hashes: readonly HashSample[];
}

export interface ReplayResult {
  readonly hashes: HashSample[];
  readonly finalHash: string;
  readonly ticks: number;
}

export function makeReplay(
  sim: Simulation,
  gameVersion: string,
  ticks: number,
  hashEvery: number,
  hashes: HashSample[],
): ReplayFile {
  return {
    format: REPLAY_FORMAT,
    gameVersion,
    physicsVersion: PHYSICS_VERSION,
    scene: { id: sim.info.sceneId, version: sim.info.sceneVersion },
    seed: sim.info.seed,
    dt: sim.info.dt,
    mechanicsSubsteps: sim.info.mechanicsSubsteps,
    ticks,
    inputs: [...sim.inputs],
    hashEvery,
    hashes,
  };
}

/** Run a scene for `ticks` ticks with the given inputs, hashing every `hashEvery` ticks. */
export async function runScene(
  scene: SceneDef,
  seed: number,
  ticks: number,
  inputs: readonly InputCommand[] = [],
  hashEvery = 60,
  dt?: number,
): Promise<{ sim: Simulation; result: ReplayResult }> {
  const sim = await Simulation.create(scene, dt === undefined ? { seed } : { seed, dt });
  for (const cmd of inputs) sim.queueInput(cmd);
  const hashes: HashSample[] = [];
  for (let t = 0; t < ticks; t++) {
    sim.step();
    if (sim.tick % hashEvery === 0 || sim.tick === ticks) hashes.push({ tick: sim.tick, hash: sim.hash() });
  }
  return { sim, result: { hashes, finalHash: sim.hash(), ticks: sim.tick } };
}

/** Re-run a replay file and return the hashes it produces now. */
export async function runReplay(replay: ReplayFile): Promise<ReplayResult> {
  const scene = getScene(replay.scene.id);
  if (scene.version !== replay.scene.version) {
    throw new Error(`replay is for ${replay.scene.id} v${replay.scene.version}, scene is v${scene.version}`);
  }
  const { result } = await runScene(scene, replay.seed, replay.ticks, replay.inputs, replay.hashEvery, replay.dt);
  return result;
}

/** Compare two hash sequences; returns the first differing sample or null. */
export function firstDivergence(
  expected: readonly HashSample[],
  actual: readonly HashSample[],
): { tick: number; expected: string; actual: string } | null {
  const n = Math.min(expected.length, actual.length);
  for (let i = 0; i < n; i++) {
    const e = expected[i] as HashSample;
    const a = actual[i] as HashSample;
    if (e.tick !== a.tick || e.hash !== a.hash) return { tick: e.tick, expected: e.hash, actual: a.hash };
  }
  if (expected.length !== actual.length) {
    return { tick: -1, expected: `${expected.length} samples`, actual: `${actual.length} samples` };
  }
  return null;
}
