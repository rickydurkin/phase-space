// Spike S1 (P00 WP0.2): Rapier determinism and cost at 1,000 bodies, 120 Hz
// tick with two substeps. Writes reports/spike-s1.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation } from '../../src/sim/index.ts';
import { stackScene } from '../../src/sim/scenes/index.ts';

const n = Number(process.argv[2] ?? 1000);
const ticks = Number(process.argv[3] ?? 600);
const scene = stackScene(n);
const sim = await Simulation.create(scene, { seed: 7 });
const times: number[] = [];
for (let t = 0; t < ticks; t++) {
  const t0 = performance.now();
  sim.step();
  times.push(performance.now() - t0);
}
times.sort((a, b) => a - b);
const pct = (p: number): number => times[Math.min(times.length - 1, Math.floor(p * times.length))] as number;
const t0 = performance.now();
const snap = sim.snapshot();
const saveMs = performance.now() - t0;
const hAfter = sim.hash();
const t1 = performance.now();
const restored = await Simulation.create(scene, { seed: 7 });
restored.restore(snap);
const restoreMs = performance.now() - t1;
const direct = await Simulation.create(scene, { seed: 7 });
direct.advance(ticks + 600);
restored.advance(600);
const obs = sim.observe();
const result = {
  date: new Date().toISOString(),
  bodies: n,
  ticks,
  tick: sim.info.dt,
  substeps: sim.info.mechanicsSubsteps,
  stepMs: { p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: times[times.length - 1], meanPerSimulatedSecond: (times.reduce((a, b) => a + b, 0) / ticks) * 120 },
  sleepingAtEnd: obs.get('mechanics.sleeping'),
  snapshotBytes: snap.length,
  snapshotBytesPerBody: snap.length / n,
  saveMs,
  restoreMs,
  restoreHashMatchesAt600: restored.hash() === direct.hash(),
  hashAfter: hAfter,
  hashRestoredPlus600: restored.hash(),
  hashDirectPlus600: direct.hash(),
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
};
mkdirSync('reports', { recursive: true });
writeFileSync(`reports/spike-s1-${n}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
