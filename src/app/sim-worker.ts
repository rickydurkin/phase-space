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
import { ReplayFileSchema } from '../content/schemas/replay.ts';
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
import type { BodyDescriptor, FrameResult, SimState, ReplayCheck, ReplayStart, ReplayProgress } from './protocol.ts';

const HASH_EVERY = 60;
const MAX_TICKS_PER_FRAME = 48;
const POSE_FIELDS = ['px', 'py', 'pz', 'qx', 'qy', 'qz', 'qw'] as const;
/** A visible replay plays this many wall seconds at the current time scale, then fast-forwards (D-003). */
const VISIBLE_REPLAY_SECONDS = 4;
/** Fast-forward speed of a visible replay, in ticks per rendered frame. */
const FAST_FORWARD_TICKS_PER_FRAME = 20_000;

interface ReplayRun {
  readonly originalHash: string;
  readonly target: number;
  wallSeconds: number;
}

/** Replay files cross a trust boundary (files, share links, the test API): validate with the schema (MASTER 5.5). */
function parseReplay(replayJson: string | ReplayFile): ReplayFile {
  const value: unknown = typeof replayJson === 'string' ? JSON.parse(replayJson) : replayJson;
  const parsed = ReplayFileSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`invalid replay file: ${issues.join('; ')}`);
  }
  return parsed.data as ReplayFile;
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
  private lastHashTick = 0;
  private lastStepMs = 0;
  private replayRun: ReplayRun | null = null;
  /** Test builds only (D-009 tests): extra wall time spent in each running frame call. */
  private frameDelayMs = 0;
  /** Running totals for perf:mac: AS milliseconds and ticks since the scene loaded. */
  private totalAsMs = 0;
  private totalTicks = 0;
  private replayDone: ReplayCheck | null = null;

  private get active(): Simulation {
    if (this.sim === null) throw new Error('no scene loaded; call load(sceneId, seed) first');
    return this.sim;
  }

  /** Create the simulation for a scene and return the bodies the renderer must draw. */
  async load(sceneId: string, seed: number): Promise<BodyDescriptor[]> {
    const scene = getScene(sceneId);
    const sim = await Simulation.create(scene, { seed });
    this.sim?.dispose();
    this.sim = sim;
    this.sceneId = sceneId;
    this.seed = seed;
    this.clock = new FrameClock(sim.info.dt, MAX_TICKS_PER_FRAME);
    this.alpha = 0;
    this.belowRealTime = false;
    this.lastStepMs = 0;
    this.replayRun = null;
    this.replayDone = null;
    this.totalAsMs = 0;
    this.totalTicks = 0;

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
    this.lastHashTick = sim.tick;
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
    if (!this.paused && this.frameDelayMs > 0) {
      // Simulates an AS that cannot keep up; time passes, state does not change.
      const until = t0 + this.frameDelayMs;
      while (performance.now() < until) {
        // busy wait (worker thread only)
      }
    }
    if (!this.paused) {
      if (this.replayRun !== null) {
        this.advanceReplay(frameSeconds);
      } else {
        const step = clock.advance(frameSeconds, this.timeScale);
        this.alpha = step.alpha;
        this.belowRealTime = step.belowRealTime;
        this.runTicks(step.ticks);
      }
    } else {
      this.belowRealTime = false;
      // While paused the HUD shows the exact hash of the current tick (cheap: it is computed once).
      if (this.lastHashTick !== sim.tick) this.setHash(sim);
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
    let replay: ReplayProgress | null = null;
    if (this.replayRun !== null) {
      replay = { state: 'running', tick: sim.tick, target: this.replayRun.target };
    } else if (this.replayDone !== null) {
      replay = { state: 'done', check: this.replayDone };
      this.replayDone = null; // reported once
    }
    const result: FrameResult = { buffer, hash: this.lastHash, hashTick: this.lastHashTick, replay };
    return Comlink.transfer(result, [buffer.buffer]);
  }

  /**
   * Start a visible replay (D-003): rebuild the run from its scene, seed and
   * input log, then play it from tick 0 through frame(): the first few wall
   * seconds at the current time scale so the motion can be watched, then fast
   * forward. At the tick where the replay started it compares its hash with
   * the original run's hash at that same tick and reports the result once as
   * frame().replay = { state: 'done' }. The replayed run then continues as the
   * live run, so nothing jumps.
   */
  async startReplay(): Promise<ReplayStart> {
    if (this.replayRun !== null) throw new Error('a replay is already running');
    const sim = this.active;
    const originalHash = sim.hash();
    const target = sim.tick;
    const inputs = [...sim.inputs];
    const fresh = await Simulation.create(getScene(this.sceneId), { seed: this.seed, dt: sim.info.dt });
    for (const cmd of inputs) fresh.queueInput(cmd);
    sim.dispose();
    this.sim = fresh;
    this.clock?.reset();
    this.alpha = 0;
    this.belowRealTime = false;
    this.capture(this.curr);
    this.prev.set(this.curr);
    this.setHash(fresh);
    this.replayDone = null;
    this.replayRun = { originalHash, target, wallSeconds: 0 };
    if (target === 0) this.finishReplay();
    return { originalHash, targetTick: target };
  }

  private advanceReplay(frameSeconds: number): void {
    const run = this.replayRun as ReplayRun;
    const sim = this.active;
    const clock = this.clock as FrameClock;
    run.wallSeconds += frameSeconds;
    const remaining = run.target - sim.tick;
    let ticks: number;
    if (run.wallSeconds <= VISIBLE_REPLAY_SECONDS) {
      const step = clock.advance(frameSeconds, this.timeScale);
      this.alpha = step.alpha;
      ticks = Math.min(step.ticks, remaining);
    } else {
      this.alpha = 1;
      ticks = Math.min(remaining, FAST_FORWARD_TICKS_PER_FRAME);
    }
    this.belowRealTime = false; // fast-forwarding is deliberate, not lost time
    this.runTicks(ticks);
    if (sim.tick >= run.target) this.finishReplay();
  }

  private finishReplay(): void {
    const run = this.replayRun;
    if (run === null) return;
    const sim = this.active;
    this.setHash(sim);
    this.replayDone = {
      originalHash: run.originalHash,
      replayHash: this.lastHash,
      matches: this.lastHash === run.originalHash,
      ticks: run.target,
    };
    this.replayRun = null;
    this.alpha = 0;
    this.prev.set(this.curr);
    this.clock?.reset();
  }

  private setHash(sim: Simulation): void {
    this.lastHash = sim.hash();
    this.lastHashTick = sim.tick;
  }

  /** Test hook (D-009): spend this many extra milliseconds in every running frame call. */
  setFrameDelay(ms: number): void {
    this.frameDelayMs = Math.max(0, ms);
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
    let count = Math.max(0, Math.floor(n));
    if (this.replayRun !== null) count = Math.min(count, this.replayRun.target - sim.tick);
    const t0 = performance.now();
    this.runTicks(count);
    this.lastStepMs = performance.now() - t0;
    this.alpha = 0;
    this.clock?.reset();
    if (this.replayRun !== null && sim.tick >= this.replayRun.target) this.finishReplay();
    else this.setHash(sim);
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
    this.replayRun = null;
    this.setHash(sim);
  }

  /** Re-run a replay file (JSON text or object) and return the hashes it produces now. */
  runReplay(replayJson: string | ReplayFile): Promise<ReplayResult> {
    return runReplay(parseReplay(replayJson));
  }

  /** Run a scene by id with no inputs; the replay page uses this across engines. */
  async runSceneById(sceneId: string, seed: number, ticks: number, hashEvery = HASH_EVERY): Promise<ReplayResult> {
    const { sim, result } = await runScene(getScene(sceneId), seed, ticks, [], hashEvery);
    sim.dispose();
    return result;
  }

  /**
   * Determinism check: rebuild the simulation from the same scene, seed and
   * input log, run to the same tick and compare hashes.
   */
  async replay(): Promise<ReplayCheck> {
    const sim = this.active;
    const originalHash = sim.hash();
    const ticks = sim.tick;
    const { sim: check, result } = await runScene(getScene(this.sceneId), this.seed, ticks, sim.inputs, HASH_EVERY, sim.info.dt);
    check.dispose();
    return { originalHash, replayHash: result.finalHash, matches: originalHash === result.finalHash, ticks };
  }

  /** AS cost so far: milliseconds spent stepping and ticks stepped (perf:mac). */
  asTotals(): { ms: number; ticks: number; dt: number } {
    return { ms: this.totalAsMs, ticks: this.totalTicks, dt: this.active.info.dt };
  }

  private runTicks(n: number): void {
    if (n <= 0) return;
    const sim = this.active;
    const started = performance.now();
    for (let i = 0; i < n; i++) {
      if (i === n - 1) this.capture(this.prev);
      sim.step();
      if (sim.tick % HASH_EVERY === 0) this.setHash(sim);
    }
    this.totalAsMs += performance.now() - started;
    this.totalTicks += n;
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
