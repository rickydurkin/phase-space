// The Authoritative Simulation host: runs in a dedicated Web Worker and is
// the only place the AS runs in the game page (MASTER 5.1). Control calls
// arrive through Comlink; each rendered frame pulls a transferable Float64Array
// of poses with the layout in protocol.ts.
//
// Wall-clock measurement (performance.now) is allowed here because this file
// is outside src/sim: it measures the AS, it never feeds it.

import * as Comlink from 'comlink';
import { Simulation, FrameClock, Pose, getScene, runScene, runReplay } from '../sim/index.ts';
import type { InputCommand, ReplayFile, ReplayResult } from '../sim/index.ts';
import {
  FRAME_HEADER,
  FRAME_BODY_STRIDE,
  FRAME_TICK,
  FRAME_SIM_TIME,
  FRAME_ALPHA,
  FRAME_BELOW_REAL_TIME,
  FRAME_AS_STEP_MS,
  FRAME_BODY_COUNT,
} from './protocol.ts';
import type { BodyDescriptor, FrameResult, SimState, ReplayCheck } from './protocol.ts';

const HASH_EVERY = 60;
const MAX_TICKS_PER_FRAME = 48;
const POSE_FIELDS = ['px', 'py', 'pz', 'qx', 'qy', 'qz', 'qw'] as const;

function parseReplay(replayJson: string | ReplayFile): ReplayFile {
  const value: unknown = typeof replayJson === 'string' ? JSON.parse(replayJson) : replayJson;
  if (typeof value !== 'object' || value === null) throw new Error('replay must be a JSON object');
  const r = value as Partial<ReplayFile>;
  if (
    typeof r.format !== 'number' ||
    typeof r.seed !== 'number' ||
    typeof r.ticks !== 'number' ||
    typeof r.hashEvery !== 'number' ||
    typeof r.scene !== 'object' ||
    r.scene === null ||
    typeof r.scene.id !== 'string' ||
    typeof r.scene.version !== 'number' ||
    !Array.isArray(r.inputs)
  ) {
    throw new Error('replay is missing format, scene, seed, ticks, hashEvery or inputs');
  }
  return r as ReplayFile;
}

export class SimWorker {
  private sim: Simulation | null = null;
  private clock: FrameClock | null = null;
  private sceneId = '';
  private seed = 0;
  private timeScale = 1;
  private paused = false;
  private bodyIds: number[] = [];
  private prev = new Float64Array(0);
  private curr = new Float64Array(0);
  private alpha = 0;
  private belowRealTime = false;
  private lastHash = '';
  private lastStepMs = 0;

  private get active(): Simulation {
    if (this.sim === null) throw new Error('no scene loaded; call load(sceneId, seed) first');
    return this.sim;
  }

  /** Create the simulation for a scene and return the bodies the renderer must draw. */
  async load(sceneId: string, seed: number): Promise<BodyDescriptor[]> {
    const scene = getScene(sceneId);
    const sim = await Simulation.create(scene, { seed });
    this.sim = sim;
    this.sceneId = sceneId;
    this.seed = seed;
    this.clock = new FrameClock(sim.info.dt, MAX_TICKS_PER_FRAME);
    this.alpha = 0;
    this.belowRealTime = false;
    this.lastStepMs = 0;

    const bodies: BodyDescriptor[] = [];
    this.bodyIds = [];
    for (const b of scene.bodies) {
      const id = sim.named.get(b.name);
      if (id === undefined) throw new Error(`scene body ${b.name} has no entity`);
      this.bodyIds.push(id);
      if (b.shape === 'ball') {
        bodies.push({ id, name: b.name, kind: b.kind, shape: 'ball', radius: b.radius ?? 0.5 });
      } else {
        const h = b.halfExtents ?? [0.5, 0.5, 0.5];
        bodies.push({ id, name: b.name, kind: b.kind, shape: 'cuboid', halfExtents: [h[0], h[1], h[2]] });
      }
    }
    this.prev = new Float64Array(this.bodyIds.length * 7);
    this.curr = new Float64Array(this.bodyIds.length * 7);
    this.capture(this.curr);
    this.prev.set(this.curr);
    this.lastHash = sim.hash();
    return bodies;
  }

  /**
   * Advance by one rendered frame's wall time (seconds, clamped by the caller).
   * Returns the pose buffer for interpolation plus the latest 60-tick hash.
   */
  frame(frameSeconds: number): FrameResult {
    const sim = this.active;
    const clock = this.clock as FrameClock;
    const t0 = performance.now();
    if (!this.paused) {
      const step = clock.advance(frameSeconds, this.timeScale);
      this.alpha = step.alpha;
      this.belowRealTime = step.belowRealTime;
      this.runTicks(step.ticks);
    } else {
      this.belowRealTime = false;
    }
    this.lastStepMs = performance.now() - t0;

    const n = this.bodyIds.length;
    const buffer = new Float64Array(FRAME_HEADER + n * FRAME_BODY_STRIDE);
    buffer[FRAME_TICK] = sim.tick;
    buffer[FRAME_SIM_TIME] = sim.time;
    buffer[FRAME_ALPHA] = this.alpha;
    buffer[FRAME_BELOW_REAL_TIME] = this.belowRealTime ? 1 : 0;
    buffer[FRAME_AS_STEP_MS] = this.lastStepMs;
    buffer[FRAME_BODY_COUNT] = n;
    for (let i = 0; i < n; i++) {
      const o = FRAME_HEADER + i * FRAME_BODY_STRIDE;
      buffer[o] = this.bodyIds[i] as number;
      for (let k = 0; k < 7; k++) {
        buffer[o + 1 + k] = this.prev[i * 7 + k] as number;
        buffer[o + 8 + k] = this.curr[i * 7 + k] as number;
      }
    }
    return Comlink.transfer({ buffer, hash: this.lastHash }, [buffer.buffer]);
  }

  setTimeScale(x: number): void {
    if (!Number.isFinite(x) || x <= 0) throw new Error(`time scale must be a positive number, got ${x}`);
    this.timeScale = x;
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.belowRealTime = false;
    else this.clock?.reset();
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Run exactly n ticks regardless of the clock (tests and stepping). Returns the new tick. */
  step(n: number): number {
    const sim = this.active;
    const count = Math.max(0, Math.floor(n));
    const t0 = performance.now();
    this.runTicks(count);
    this.lastStepMs = performance.now() - t0;
    this.alpha = 0;
    this.clock?.reset();
    return sim.tick;
  }

  /** Exact hash of the current state. */
  hash(): string {
    return this.active.hash();
  }

  getState(): SimState {
    const sim = this.active;
    const pose = sim.world.store(Pose);
    const bodies = this.bodyIds.map((id) => ({
      id,
      p: [pose.field('px')[id] as number, pose.field('py')[id] as number, pose.field('pz')[id] as number] as const,
      q: [
        pose.field('qx')[id] as number,
        pose.field('qy')[id] as number,
        pose.field('qz')[id] as number,
        pose.field('qw')[id] as number,
      ] as const,
    }));
    return { tick: sim.tick, time: sim.time, hash: sim.hash(), bodies };
  }

  queueInput(cmd: InputCommand): void {
    this.active.queueInput(cmd);
  }

  snapshot(): Uint8Array {
    const bytes = this.active.snapshot().slice();
    return Comlink.transfer(bytes, [bytes.buffer]);
  }

  restore(bytes: Uint8Array): void {
    const sim = this.active;
    sim.restore(bytes);
    this.capture(this.curr);
    this.prev.set(this.curr);
    this.alpha = 0;
    this.clock?.reset();
    this.lastHash = sim.hash();
  }

  /** Re-run a replay file (JSON text or object) and return the hashes it produces now. */
  runReplay(replayJson: string | ReplayFile): Promise<ReplayResult> {
    return runReplay(parseReplay(replayJson));
  }

  /**
   * Determinism check: rebuild the simulation from the same scene, seed and
   * input log, run to the same tick and compare hashes.
   */
  async replay(): Promise<ReplayCheck> {
    const sim = this.active;
    const originalHash = sim.hash();
    const ticks = sim.tick;
    const { result } = await runScene(getScene(this.sceneId), this.seed, ticks, sim.inputs, HASH_EVERY, sim.info.dt);
    return { originalHash, replayHash: result.finalHash, matches: originalHash === result.finalHash, ticks };
  }

  private runTicks(n: number): void {
    if (n <= 0) return;
    const sim = this.active;
    for (let i = 0; i < n; i++) {
      if (i === n - 1) this.capture(this.prev);
      sim.step();
      if (sim.tick % HASH_EVERY === 0) this.lastHash = sim.hash();
    }
    this.capture(this.curr);
  }

  private capture(into: Float64Array): void {
    const pose = this.active.world.store(Pose);
    for (let i = 0; i < this.bodyIds.length; i++) {
      const id = this.bodyIds[i] as number;
      for (let k = 0; k < POSE_FIELDS.length; k++) {
        into[i * 7 + k] = pose.field(POSE_FIELDS[k] as (typeof POSE_FIELDS)[number])[id] as number;
      }
    }
  }
}

Comlink.expose(new SimWorker());
