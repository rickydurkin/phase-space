import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  Simulation,
  FrameClock,
  getScene,
  runReplay,
  firstDivergence,
  PHYSICS_VERSION,
} from '../../src/sim/index.ts';
import type { ReplayFile } from '../../src/sim/index.ts';
import { runInStubbedWorker } from './harness/run.ts';

const golden = JSON.parse(readFileSync(new URL('./cube-drop.golden.json', import.meta.url), 'utf8')) as ReplayFile;
const finalGolden = golden.hashes[golden.hashes.length - 1]?.hash as string;

describe('golden replay: cube-drop', () => {
  it('golden file is for the current physics version and has its samples', () => {
    expect(golden.physicsVersion).toBe(PHYSICS_VERSION);
    expect(golden.hashes.length).toBe(golden.ticks / golden.hashEvery);
    expect(finalGolden).toMatch(/^[0-9a-f]{16}$/);
  });

  it('three in-process runs give the golden hashes', async () => {
    for (let i = 0; i < 3; i++) {
      const r = await runReplay(golden);
      const d = firstDivergence(golden.hashes, r.hashes);
      expect(d, `run ${i + 1} diverged: ${JSON.stringify(d)}`).toBeNull();
      expect(r.finalHash).toBe(finalGolden);
    }
  });

  it('the stubbed worker is live: Math.sin throws inside it', async () => {
    const probe = await runInStubbedWorker({ mode: 'probe' });
    expect(probe.ok).toBe(true);
    expect(probe.threw).toBe(true);
  });

  it('runs to the golden hashes in a worker where Math.random, Date, performance.now and non-allowlisted Math throw', async () => {
    const out = await runInStubbedWorker({ mode: 'replay', replay: golden });
    expect(out.ok, out.error).toBe(true);
    expect(out.calls).toEqual([]);
    expect(firstDivergence(golden.hashes, out.result?.hashes ?? [])).toBeNull();
    // Rapier's profiler timer was answered with a constant; the hashes above prove it never fed the physics.
    console.log(`inert performance.now reads by Rapier's profiler: ${out.inertTimerReads ?? 0}`);
  });

  it('frame pacing at 30, 60, 120 and 144 Hz and time scales 0.01x, 1x and 100x do not change the hash', async () => {
    const scene = getScene(golden.scene.id);
    for (const fps of [30, 60, 120, 144]) {
      for (const scale of [0.01, 1, 100]) {
        const sim = await Simulation.create(scene, { seed: golden.seed });
        const clock = new FrameClock(sim.info.dt);
        let frames = 0;
        while (sim.tick < golden.ticks) {
          const step = clock.advance(1 / fps, scale);
          sim.advance(Math.min(step.ticks, golden.ticks - sim.tick));
          frames++;
          if (frames > 5_000_000) throw new Error('clock did not advance');
        }
        expect(sim.hash(), `fps=${fps} scale=${scale}`).toBe(finalGolden);
      }
    }
  });

  it('snapshot at tick 300, restore, run on: hash equals the uninterrupted run', async () => {
    const scene = getScene(golden.scene.id);
    const a = await Simulation.create(scene, { seed: golden.seed });
    a.advance(300);
    const snap = a.snapshot();
    const h300 = a.hash();
    const b = await Simulation.create(scene, { seed: golden.seed });
    b.restore(snap);
    expect(b.tick).toBe(300);
    expect(b.hash()).toBe(h300);
    b.advance(golden.ticks - 300);
    expect(b.hash()).toBe(finalGolden);
    // and 600 more ticks beyond the golden length match a direct run too
    a.advance(golden.ticks - 300 + 600);
    b.advance(600);
    expect(b.hash()).toBe(a.hash());
  });
});
