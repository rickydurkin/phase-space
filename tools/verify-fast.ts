// verify:fast (MASTER 13.1): typecheck, lint, boundaries, unit tests, golden
// smoke, count check. Budget 90 s. Logs to reports/verify-fast.log with
// grep-able ERROR lines; prints one line per step.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

interface Step { name: string; cmd: string; args: string[] }
const steps: Step[] = [
  { name: 'typecheck sim', cmd: 'npx', args: ['tsc', '-p', 'tsconfig.sim.json', '--pretty', 'false'] },
  { name: 'typecheck app', cmd: 'npx', args: ['tsc', '-p', 'tsconfig.app.json', '--pretty', 'false'] },
  { name: 'typecheck node', cmd: 'npx', args: ['tsc', '-p', 'tsconfig.node.json', '--pretty', 'false'] },
  { name: 'eslint', cmd: 'npx', args: ['eslint', '.'] },
  { name: 'content lint', cmd: 'node', args: ['tools/content-lint.ts'] },
  { name: 'dependency boundaries', cmd: 'npx', args: ['depcruise', 'src', '--config', '.dependency-cruiser.cjs'] },
  { name: 'unit tests', cmd: 'npx', args: ['vitest', 'run', '--project', 'unit'] },
  { name: 'golden smoke', cmd: 'npx', args: ['vitest', 'run', '--project', 'golden'] },
  { name: 'count check', cmd: 'node', args: ['tools/check-counts.ts'] },
];

mkdirSync('reports', { recursive: true });
const t0 = performance.now();
let log = '';
let failed = 0;
const summary: { step: string; ok: boolean; seconds: number }[] = [];
for (const s of steps) {
  const start = performance.now();
  const r = spawnSync(s.cmd, s.args, { encoding: 'utf8', shell: process.platform === 'win32', env: { ...process.env, FORCE_COLOR: '0' } });
  const seconds = (performance.now() - start) / 1000;
  const ok = (r.status ?? 1) === 0;
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  log += `\n===== ${s.name} (${ok ? 'ok' : 'FAILED'}, ${seconds.toFixed(1)} s) =====\n${out}`;
  summary.push({ step: s.name, ok, seconds });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.name.padEnd(24)} ${seconds.toFixed(1)} s`);
  if (!ok) {
    failed++;
    const tail = out.split('\n').filter((l) => l.trim() !== '').slice(-25).join('\n');
    console.error(`ERROR ${s.name} failed:\n${tail}`);
  }
}
const total = (performance.now() - t0) / 1000;
writeFileSync('reports/verify-fast.log', log);
writeFileSync('reports/verify-fast.json', JSON.stringify({ date: new Date().toISOString(), total, failed, summary }, null, 2));
console.log(`verify:fast ${failed === 0 ? 'passed' : `FAILED (${failed} steps)`} in ${total.toFixed(1)} s (budget 90 s)`);
if (total > 90) console.warn('WARN verify:fast exceeded its 90 s budget');
process.exit(failed === 0 ? 0 : 1);
