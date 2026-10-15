// CI fails if the number of tests, benches or missions falls (MASTER 2.6).
// Baseline in tests/counts.json; `--update` raises it (never lowers it).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const testFiles = [...walk('tests')].filter((f) => /\.(test|spec)\.ts$/.test(f));
let testCases = 0;
for (const f of testFiles) {
  const src = readFileSync(f, 'utf8');
  testCases += (src.match(/^\s*(it|test)\(/gm) ?? []).length;
}
const benches = Object.keys(JSON.parse(readFileSync('tests/validation/benches.json', 'utf8')) as object).filter((k) => !k.startsWith('_')).length;
const missions = existsSync('content/missions') ? readdirSync('content/missions').filter((f) => f.endsWith('.json')).length : 0;
const goldens = existsSync('tests/golden') ? readdirSync('tests/golden').filter((f) => f.endsWith('.golden.json')).length : 0;
const current = { testFiles: testFiles.length, testCases, benches, missions, goldens };

const path = 'tests/counts.json';
const baseline = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, number>) : {};
let failed = false;
for (const [k, v] of Object.entries(current)) {
  const b = baseline[k] ?? 0;
  const mark = v < b ? 'ERROR fell' : v > b ? 'up' : 'same';
  if (v < b) failed = true;
  console.log(`${k.padEnd(10)} baseline ${String(b).padStart(5)} now ${String(v).padStart(5)}  ${mark}`);
}
if (failed) {
  console.error('ERROR check-counts: a count fell below the baseline. Tests, benches, golden files and missions may not be removed (MASTER 2.6).');
  process.exit(1);
}
if (process.argv.includes('--update')) {
  writeFileSync(path, JSON.stringify(current, null, 2) + '\n');
  console.log('check-counts: baseline updated');
}
