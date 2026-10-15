import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Simulation, randomDropScene, Pose, Velocity } from '../../src/sim/index.ts';

// Random drop scenes: determinism, finite state, snapshot round trip.
// Seeds are logged by fast-check on failure; freeze any counterexample as a test.
const RUNS = Number(process.env['FUZZ_RUNS'] ?? (process.env['CI'] ? 25 : 60));
const TICKS = 600;

function assertFinite(sim: Simulation): void {
  const pose = sim.world.store(Pose);
  const vel = sim.world.store(Velocity);
  for (const id of sim.world.entities(Pose)) {
    for (const f of Pose.fields) expect(Number.isFinite(pose.field(f)[id] as number), `${f} of ${id}`).toBe(true);
    if (sim.world.has(id, Velocity)) {
      for (const f of Velocity.fields) expect(Number.isFinite(vel.field(f)[id] as number), `${f} of ${id}`).toBe(true);
    }
    // nothing fell through the 1 m thick floor (top at y = 0) by more than tolerance
    expect(pose.field('py')[id] as number).toBeGreaterThan(-1.5);
  }
}

describe('scene fuzzing', () => {
  it('random drop scenes are deterministic, finite, do not tunnel, and survive a snapshot round trip', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 2_000_000_000 }), async (seed) => {
        const scene = randomDropScene(seed);
        const a = await Simulation.create(scene, { seed });
        const b = await Simulation.create(scene, { seed });
        a.advance(TICKS / 2);
        const snap = a.snapshot();
        a.advance(TICKS / 2);
        b.advance(TICKS);
        expect(a.hash()).toBe(b.hash());
        assertFinite(a);
        const c = await Simulation.create(scene, { seed });
        c.restore(snap);
        c.advance(TICKS / 2);
        expect(c.hash()).toBe(a.hash());
      }),
      { numRuns: RUNS, verbose: true },
    );
  });
});
