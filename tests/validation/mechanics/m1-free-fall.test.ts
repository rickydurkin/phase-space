import { describe, it, expect } from 'vitest';
import { Simulation, freeFall, Pose } from '../../../src/sim/index.ts';
import benches from '../benches.json' with { type: 'json' };

const M1 = benches.M1;

/** Fall distance at time t from the game's own simulation. */
async function measuredDrop(g = M1.g): Promise<number> {
  const scene = { ...freeFall, gravity: [0, -g, 0] as const };
  const sim = await Simulation.create(scene, { seed: M1.seed });
  const ticks = Math.round(M1.t / sim.info.dt);
  sim.advance(ticks);
  const id = sim.named.get('ball') as number;
  return M1.y0 - (sim.world.store(Pose).field('py')[id] as number);
}

function check(measured: number, expected: number, tol: number): { error: number; pass: boolean } {
  const error = Math.abs(measured - expected) / expected;
  return { error, pass: error <= tol };
}

describe('M1 free fall', () => {
  it('position at 2 s within 0.5% of the analytic value', async () => {
    const expected = 0.5 * M1.g * M1.t * M1.t;
    const measured = await measuredDrop();
    const r = check(measured, expected, M1.tolerance);
    console.log(`M1 expected=${expected.toFixed(5)} measured=${measured.toFixed(5)} error=${(r.error * 100).toFixed(4)}%`);
    expect(r.pass).toBe(true);
  });

  it('negative control: a 2% error in g must fail the bench', async () => {
    const expected = 0.5 * M1.g * M1.t * M1.t;
    const measured = await measuredDrop(M1.g * 1.02);
    expect(check(measured, expected, M1.tolerance).pass).toBe(false);
  });
});
