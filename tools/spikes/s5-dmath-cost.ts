// Spike S5 (P00 WP0.2): cost of dmath against Math over a million calls each.
import { writeFileSync, mkdirSync } from 'node:fs';
import * as dmath from '../../src/sim/dmath/index.ts';

const N = 1_000_000;
const xs = new Float64Array(N);
let s = 1;
for (let i = 0; i < N; i++) {
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  xs[i] = (s / 4294967296) * 20 - 10;
}
const pos = xs.map((x) => Math.abs(x) + 0.001);
function time(f: (x: number) => number, arr: Float64Array): number {
  let acc = 0;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) acc += f(arr[i] as number);
  const dt = performance.now() - t0;
  if (acc === 12345.678) console.log('');
  return (dt / N) * 1e6; // ns per call
}
const rows: Record<string, number>[] = [];
const pairs: Array<[string, (x: number) => number, (x: number) => number, Float64Array]> = [
  ['sin', dmath.sin, Math.sin, xs], ['cos', dmath.cos, Math.cos, xs], ['tan', dmath.tan, Math.tan, xs],
  ['exp', dmath.exp, Math.exp, xs], ['expm1', dmath.expm1, Math.expm1, xs], ['log', dmath.log, Math.log, pos],
  ['log1p', dmath.log1p, Math.log1p, pos], ['log2', dmath.log2, Math.log2, pos], ['log10', dmath.log10, Math.log10, pos],
  ['atan', dmath.atan, Math.atan, xs], ['asin', (x) => dmath.asin(x / 10), (x) => Math.asin(x / 10), xs], ['acos', (x) => dmath.acos(x / 10), (x) => Math.acos(x / 10), xs],
  ['sinh', dmath.sinh, Math.sinh, xs], ['cosh', dmath.cosh, Math.cosh, xs], ['tanh', dmath.tanh, Math.tanh, xs], ['cbrt', dmath.cbrt, Math.cbrt, xs],
  ['pow', (x) => dmath.pow(Math.abs(x) + 1, 1.7), (x) => Math.pow(Math.abs(x) + 1, 1.7), xs],
  ['atan2', (x) => dmath.atan2(x, 1.3), (x) => Math.atan2(x, 1.3), xs], ['hypot', (x) => dmath.hypot(x, 2.5), (x) => Math.hypot(x, 2.5), xs],
];
for (const [name, d, m, arr] of pairs) {
  time(d, arr); time(m, arr); // warm up
  const dn = time(d, arr);
  const mn = time(m, arr);
  rows.push({ [name]: 0, dmathNs: Math.round(dn), mathNs: Math.round(mn), ratio: Math.round((dn / mn) * 100) / 100 });
  console.log(`${name.padEnd(6)} dmath ${dn.toFixed(0).padStart(4)} ns  Math ${mn.toFixed(0).padStart(4)} ns  ratio ${(dn / mn).toFixed(2)}`);
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/spike-s5.json', JSON.stringify({ date: new Date().toISOString(), node: process.version, samples: N, rows }, null, 2));
