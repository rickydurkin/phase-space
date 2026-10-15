// Spike S6 (P00 WP0.2): AS cost with mechanics only at 120, 240, 480 and 960 Hz
// ticks, and the body counts that 480 and 960 Hz can afford within the
// MASTER 12 budget of 300 ms of AS time per simulated second.
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation } from '../../src/sim/index.ts';
import { stackScene } from '../../src/sim/scenes/index.ts';

const BUDGET_MS_PER_SIM_SECOND = 300;
const results: Record<string, unknown>[] = [];
async function measure(bodies: number, hz: number, seconds = 2): Promise<number> {
  const scene = { ...stackScene(bodies), dt: 1 / hz, mechanicsSubsteps: 2 };
  const sim = await Simulation.create(scene, { seed: 3 });
  const ticks = Math.round(seconds * hz);
  const t0 = performance.now();
  sim.advance(ticks);
  return (performance.now() - t0) / seconds;
}
for (const hz of [120, 240, 480, 960]) {
  const msPerSimSecond = await measure(300, hz);
  results.push({ bodies: 300, hz, msPerSimSecond: Math.round(msPerSimSecond) });
  console.log(`300 bodies at ${hz} Hz: ${msPerSimSecond.toFixed(0)} ms per simulated second`);
}
for (const hz of [480, 960]) {
  let affordable = 0;
  for (const bodies of [50, 100, 200, 300, 500, 800]) {
    const ms = await measure(bodies, hz, 1);
    console.log(`${bodies} bodies at ${hz} Hz: ${ms.toFixed(0)} ms per simulated second`);
    if (ms <= BUDGET_MS_PER_SIM_SECOND) affordable = bodies;
    else break;
  }
  results.push({ hz, affordableBodiesWithinBudget: affordable, budgetMsPerSimSecond: BUDGET_MS_PER_SIM_SECOND });
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/spike-s6.json', JSON.stringify({ date: new Date().toISOString(), node: process.version, results }, null, 2));
