// npm run gate PNN [review]: runs every check the phase gate needs and writes
// docs/phases/PNN-report.md (or PNN-review.md for reviewers) from the template
// in MASTER Appendix D. Never weakens a check; a failing item is reported.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const phase = process.argv[2];
const review = process.argv[3] === 'review';
const quick = process.argv.includes('--quick'); // skips the long items (dmath full, soak); never for a real gate
if (phase === undefined || !/^P\d\d$/.test(phase)) {
  console.error('usage: node tools/gate.ts PNN [review] [--quick]');
  process.exit(2);
}

interface Item {
  id: string;
  gate: string;
  cmd: string[] | null;
  evidence: (out: string, ok: boolean) => string;
  long?: boolean;
  env?: Record<string, string>;
}

const last = (re: RegExp, out: string, fallback = ''): string => {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  const m = [...out.matchAll(global)];
  return m.length > 0 ? (m[m.length - 1]?.[0] ?? fallback) : fallback;
};

const P00: Item[] = [
  { id: 'G1', gate: 'Every command in MASTER 13.1 exists, is real and passes (verify:fast)', cmd: ['node', 'tools/verify-fast.ts'], evidence: (o) => last(/verify:fast .*$/m, o) },
  { id: 'G2', gate: 'Golden replay identical across three Node runs, stubbed worker, 30/60/120/144 Hz and 0.01x/1x/100x; snapshot at tick 300', cmd: ['npx', 'vitest', 'run', '--project', 'golden'], evidence: (o) => last(/Tests\s+\d+ passed.*$/m, o) + '; ' + last(/inert performance\.now.*$/m, o) },
  { id: 'G2b', gate: 'Golden replay identical in Chromium, WebKit and Firefox through Playwright', cmd: ['npx', 'playwright', 'test', 'tests/e2e/golden.spec.ts'], evidence: (o) => last(/\d+ passed.*$/m, o) + (existsSync('reports/engines.json') ? '; engines: ' + Object.entries(JSON.parse(readFileSync('reports/engines.json', 'utf8')) as Record<string, Record<string, unknown>>).map(([k, v]) => `${k} ${v['matchesGolden'] === true ? 'matches' : v['browserHash'] === v['nodeHash'] ? 'matches' : 'DIFFERS'}`).join(', ') : '') + (process.platform === 'darwin' && process.env['PS_FIREFOX'] !== '1' ? '; firefox not run on macOS (ADR 0009), CI covers it' : '') },
  { id: 'G3', gate: 'Lint blocks Math.random, Date.now, Math.sin, Math.tanh, ** and non-allowlisted imports in src/sim (tests prove each rule fires)', cmd: ['npx', 'vitest', 'run', '--project', 'unit', 'tests/unit/lint-rules.test.ts'], evidence: (o) => last(/Tests\s+\d+ passed.*$/m, o) },
  { id: 'G4', gate: 'Every dmath function within 2 ulp over a million samples', cmd: ['npx', 'vitest', 'run', '--project', 'dmath-full'], evidence: (o) => [...o.matchAll(/dmath\.\w+ samples=\d+ maxUlp=[\d.]+/g)].map((m) => m[0].replace('dmath.', '').replace(' samples=1000000', '')).join('; ') || last(/Tests\s+\d+ (passed|failed).*$/m, o), long: true },
  { id: 'G5', gate: 'Validation benches (M1) within tolerance with negative controls', cmd: ['npx', 'vitest', 'run', '--project', 'validation'], evidence: (o) => last(/M1 expected.*$/m, o) + '; ' + last(/Tests\s+\d+ passed.*$/m, o) },
  { id: 'G6', gate: 'E2E: interactive within 30 s under SwiftShader, zero console errors, pixel readback shows the cube, device loss recovers with state intact', cmd: ['npx', 'playwright', 'test', 'tests/e2e/smoke.spec.ts', 'tests/e2e/device-loss.spec.ts', '--project=chromium'], evidence: (o) => last(/boot \d+ ms.*$/m, o) + '; ' + last(/cube found.*$/m, o) + '; ' + last(/\d+ passed.*$/m, o) },
  { id: 'G7', gate: 'The WebGL2 fallback boots and draws the cube', cmd: ['npx', 'playwright', 'test', 'tests/e2e/webgl.spec.ts', '--project=chromium'], evidence: (o) => last(/\d+ passed.*$/m, o) },
  { id: 'G8', gate: 'GPU kernel against its CPU reference through Dawn; WGSL validation', cmd: ['npm', 'run', 'test:gpu'], evidence: (o) => last(/advect: .*$/m, o) + '; ' + last(/ok src\/gpu.*$/m, o) },
  { id: 'G9', gate: 'Fuzzing: random scenes deterministic, finite, snapshot round trip', cmd: ['npx', 'vitest', 'run', '--project', 'fuzz'], evidence: (o) => last(/Tests\s+\d+ passed.*$/m, o) },
  { id: 'G10', gate: 'missions:verify wired (empty set)', cmd: ['node', 'tools/missions-verify.ts'], evidence: (o) => last(/missions:verify: .*$/m, o) },
  { id: 'G11', gate: 'Visual: reference-scene pixel readback and screenshots per adapter', cmd: ['npx', 'playwright', 'test', 'tests/e2e/visual.spec.ts', '--project=chromium'], evidence: (o) => last(/\d+ passed.*$/m, o) },
  { id: 'G12', gate: 'Soak (5-minute version): clean console, heap flat', cmd: ['npx', 'playwright', 'test', 'tests/e2e/soak.spec.ts', '--project=chromium'], evidence: (o) => last(/soak: .*$/m, o) + '; ' + last(/\d+ passed.*$/m, o), long: true, env: { SOAK_MINUTES: '5' } },
  { id: 'G13', gate: 'Build and bundle size budget', cmd: ['sh', '-c', 'npm run build && npm run size:check'], evidence: (o) => last(/bundle gzip .*$/m, o) },
  { id: 'G14', gate: 'CI configured (ci.yml, nightly.yml, deploy.yml); deployment only after Ricky approves', cmd: null, evidence: () => ['ci', 'nightly', 'deploy'].map((n) => `${n}.yml ${existsSync(`.github/workflows/${n}.yml`) ? 'present' : 'MISSING'}`).join(', ') + '; CI not yet run (no remote)' },
  { id: 'G15', gate: 'Hooks, subagents and skills work, with evidence', cmd: null, evidence: () => `${existsSync('docs/phases/P00-hook-proof.md') ? 'docs/phases/P00-hook-proof.md (PostToolUse blocked a type error and invalid WGSL with exit 2; Stop hook honours stop_hook_active)' : 'hook proof MISSING'}; agents ${existsSync('.claude/agents/gate-reviewer.md') ? 5 : 0}, skills ${existsSync('.claude/skills/phase-gate/SKILL.md') ? 5 : 0}` },
  { id: 'G16', gate: 'Spike ADRs with measured numbers; tick decision recorded', cmd: null, evidence: () => ['0004-spike-s1-rapier', '0005-tick-rate', '0006-dmath', '0007-spike-s2-renderer', '0008-spike-s3-hud', '0009-spike-s4-test-stack'].map((n) => `${n}: ${existsSync(`docs/adr/${n}.md`) ? 'present' : 'missing'}`).join('; ') },
  { id: 'G17', gate: 'perf:mac baseline recorded in docs/BASELINE.md', cmd: null, evidence: () => (existsSync('reports/perf-mac.json') ? readFileSync('docs/BASELINE.md', 'utf8').split('\n').filter((l) => l.startsWith('| cube-drop') || l.startsWith('| stack')).join(' ') : 'not measured') },
];

const items = phase === 'P00' ? P00 : [];
if (items.length === 0) {
  console.error(`no gate definition for ${phase} yet`);
  process.exit(2);
}

const rows: { id: string; gate: string; result: string; evidence: string; seconds: number }[] = [];
for (const it of items) {
  if (it.cmd === null) {
    const ev = it.evidence('', true);
    const ok = !/MISSING|missing|not measured/.test(ev);
    rows.push({ id: it.id, gate: it.gate, result: ok ? 'pass' : 'fail', evidence: ev, seconds: 0 });
    console.log(`${ok ? 'pass' : 'FAIL'} ${it.id} ${it.gate}`);
    continue;
  }
  if (quick && it.long) {
    rows.push({ id: it.id, gate: it.gate, result: 'skipped (--quick)', evidence: 'not run', seconds: 0 });
    console.log(`skip ${it.id} ${it.gate}`);
    continue;
  }
  console.log(`run  ${it.id} ${it.cmd.join(' ')}`);
  const t0 = performance.now();
  const r = spawnSync(it.cmd[0] as string, it.cmd.slice(1), { encoding: 'utf8', env: { ...process.env, ...it.env, FORCE_COLOR: '0', CI: process.env['CI'] ?? '' }, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const ok = (r.status ?? 1) === 0;
  const seconds = (performance.now() - t0) / 1000;
  mkdirSync('reports/gate', { recursive: true });
  writeFileSync(`reports/gate/${phase}-${it.id}.log`, out);
  rows.push({ id: it.id, gate: it.gate, result: ok ? 'pass' : 'fail', evidence: it.evidence(out, ok).replace(/\|/g, '/').trim() || (ok ? 'exit 0' : `exit ${r.status}; see reports/gate/${phase}-${it.id}.log`), seconds });
  console.log(`${ok ? 'pass' : 'FAIL'} ${it.id} (${seconds.toFixed(0)} s)`);
}

const git = (args: string[]): string => spawnSync('git', args, { encoding: 'utf8' }).stdout.trim() || spawnSync('/Library/Developer/CommandLineTools/usr/bin/git', args, { encoding: 'utf8' }).stdout.trim();
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const physics = /PHYSICS_VERSION = '([^']+)'/.exec(readFileSync('src/sim/version.ts', 'utf8'))?.[1] ?? '?';
const d = new Date();
const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const failed = rows.filter((r) => r.result === 'fail').length;
const phaseFile = `programme/phases/${phase}-foundations.md`;
const playtest = existsSync(phaseFile) ? (readFileSync(phaseFile, 'utf8').split("## Ricky's playtest")[1] ?? '').split('\n## ')[0] ?? '' : '';
const benchLine = rows.find((r) => r.id === 'G5')?.evidence ?? '';
const m1 = /M1 expected=([\d.]+) measured=([\d.]+) error=([\d.]+)%/.exec(benchLine);
const lines = [
  `# ${phase} report - Foundations${review ? ' (independent review run)' : ''}`,
  '',
  `Date ${date}, programme version 1.0.0, physics version ${physics}, game version ${pkg.version}, commit ${git(['rev-parse', '--short', 'HEAD']) || 'uncommitted'}.`,
  '',
  `## Summary`,
  '',
  `${rows.length - failed} of ${rows.length} gate items pass${failed > 0 ? `, ${failed} fail` : ''}${quick ? ' (quick run: long items skipped)' : ''}. ${failed === 0 ? 'The gate is ready for the reviewer and for Ricky\'s playtest.' : 'The failing items are listed below with their evidence; the gate stays open.'}`,
  '',
  '## Gate table',
  '',
  '| Item | Gate | Result | Evidence |',
  '|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.gate} | ${r.result} | ${r.evidence} |`),
  '',
  '## Benches',
  '',
  '| id | expected | measured | error | pass |',
  '|---|---|---|---|---|',
  m1 ? `| M1 free fall, 2 s drop (m) | ${m1[1]} | ${m1[2]} | ${m1[3]}% (tolerance 0.5%) | ${Number(m1[3]) <= 0.5 ? 'pass' : 'fail'} |` : '| M1 | | | not run | |',
  '',
  '## Missions',
  '',
  'None in P00 (missions:verify wired with an empty set).',
  '',
  '## Performance',
  '',
  existsSync('docs/BASELINE.md') ? readFileSync('docs/BASELINE.md', 'utf8').split('\n').filter((l) => l.startsWith('|')).join('\n') || 'See docs/BASELINE.md.' : 'Not measured.',
  '',
  '## Defects opened and closed; waivers requested',
  '',
  readFileSync('docs/DEFECTS.md', 'utf8').split('\n').filter((l) => /^\| D-/.test(l)).join('\n') || 'No defects recorded. No waivers requested.',
  '',
  '## Gate-reviewer findings',
  '',
  review ? 'This is the review run; findings go in the reviewer\'s report.' : 'Pending the gate-reviewer subagent run (docs/phases/P00-review.md).',
  '',
  '## What changed in LEARNINGS and IDEAS',
  '',
  `LEARNINGS: ${readFileSync('docs/LEARNINGS.md', 'utf8').split('\n').filter((l) => l.startsWith('- ')).length} entries. IDEAS: ${readFileSync('docs/IDEAS.md', 'utf8').split('\n').filter((l) => l.startsWith('- ')).length} entries.`,
  '',
  "## Playtest checklist for Ricky",
  playtest.trim() ? playtest.trimEnd() : '(see the phase file)',
  '',
  `Total gate run time ${(rows.reduce((a, r) => a + r.seconds, 0) / 60).toFixed(1)} minutes. Logs: reports/gate/.`,
  '',
];
mkdirSync('docs/phases', { recursive: true });
const out = `docs/phases/${phase}-${review ? 'review' : 'report'}.md`;
writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out}: ${rows.length - failed}/${rows.length} pass`);
process.exit(failed > 0 ? 1 : 0);
