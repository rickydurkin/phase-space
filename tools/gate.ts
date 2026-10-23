// npm run gate PNN [review] [--quick]
//
// Runs every check the phase gate needs and writes docs/phases/PNN-report.md
// (or PNN-review.md for an independent reviewer) from MASTER Appendix D.
//
// Rules (D-007, from the P00 gate review):
// - The gate items and their wording come from the phase file, not from here.
// - Each item is pass, fail, blocked (the evidence cannot be produced in this
//   environment, for example Firefox on macOS or CI with no remote) or not run.
//   Only pass counts. Nothing passes without the evidence the item names.
// - Results are read from structured reports (Vitest and Playwright JSON),
//   never from coloured console text.
// - The review run carries no builder commentary.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { loadavg, cpus, homedir } from 'node:os';

const phase = process.argv[2];
const review = process.argv.includes('review');
const quick = process.argv.includes('--quick'); // skips the long checks; never valid for closing a gate
if (phase === undefined || !/^P\d\d$/.test(phase)) {
  console.error('usage: node tools/gate.ts PNN [review] [--quick]');
  process.exit(2);
}
if (phase !== 'P00') {
  console.error(`no gate definition for ${phase} yet`);
  process.exit(2);
}

type Result = 'pass' | 'fail' | 'blocked' | 'not run';
const GIT = existsSync('/Library/Developer/CommandLineTools/usr/bin/git') ? '/Library/Developer/CommandLineTools/usr/bin/git' : 'git';
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*[A-Za-z]', 'g');
const LOGS = 'reports/gate';
mkdirSync(LOGS, { recursive: true });
// Read before any check runs: the golden spec rewrites the tracked reports/engines.json.
const head = spawnSync(GIT, ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const clean = spawnSync(GIT, ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).stdout.trim() === '';

// ---------------------------------------------------------------- running checks

interface Run {
  readonly label: string;
  readonly ok: boolean;
  readonly exit: number;
  readonly out: string;
  readonly seconds: number;
  readonly ran: boolean;
}

const runs = new Map<string, Run>();

function run(label: string, cmd: string[], env: Record<string, string> = {}, skip = false): Run {
  const cached = runs.get(label);
  if (cached !== undefined) return cached;
  if (skip) {
    const r: Run = { label, ok: false, exit: -1, out: '', seconds: 0, ran: false };
    runs.set(label, r);
    console.log(`skip ${label} (--quick)`);
    return r;
  }
  console.log(`run  ${label}: ${cmd.join(' ')}`);
  const t0 = performance.now();
  const p = spawnSync(cmd[0] as string, cmd.slice(1), {
    encoding: 'utf8',
    env: { ...process.env, ...env, FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 256 * 1024 * 1024,
  });
  const out = `${p.stdout ?? ''}${p.stderr ?? ''}`.replace(ANSI, '');
  const seconds = (performance.now() - t0) / 1000;
  writeFileSync(`${LOGS}/${phase}-${label}.log`, out);
  const r: Run = { label, ok: p.status === 0, exit: p.status ?? -1, out, seconds, ran: true };
  runs.set(label, r);
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${label} (${seconds.toFixed(0)} s)`);
  return r;
}

function line(re: RegExp, text: string): string {
  const all = [...text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))];
  return all.length > 0 ? (all[all.length - 1]?.[0] ?? '').trim() : '';
}

// Vitest JSON: { testResults: [{ name, assertionResults: [{ title, fullName, status }] }] }
interface VitestJson {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  testResults: Array<{ name: string; assertionResults: Array<{ title: string; fullName: string; status: string }> }>;
}

function vitest(label: string, args: string[], skip = false): { run: Run; json: VitestJson | null } {
  const file = `${LOGS}/${phase}-${label}.json`;
  const r = run(label, ['npx', 'vitest', 'run', ...args, '--reporter=default', '--reporter=json', `--outputFile.json=${file}`], {}, skip);
  const json = r.ran && existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as VitestJson) : null;
  return { run: r, json };
}

function vitestTest(json: VitestJson | null, title: RegExp): string {
  if (json === null) return 'missing';
  for (const f of json.testResults) for (const a of f.assertionResults) if (title.test(a.fullName) || title.test(a.title)) return a.status;
  return 'missing';
}

// Playwright JSON (reporter configured in playwright.config.ts): nested suites of specs.
interface PwResult {
  status: string;
  stdout?: Array<{ text?: string }>;
}
interface PwTest {
  projectName: string;
  results: PwResult[];
}
interface PwSpec {
  title: string;
  tests: PwTest[];
}
interface PwSuite {
  title: string;
  specs?: PwSpec[];
  suites?: PwSuite[];
}
interface PwRow {
  file: string;
  title: string;
  project: string;
  status: string;
  stdout: string;
}

function playwrightRows(file = 'reports/playwright.json'): PwRow[] {
  if (!existsSync(file)) return [];
  const json = JSON.parse(readFileSync(file, 'utf8')) as { suites: PwSuite[] };
  const rows: PwRow[] = [];
  const walk = (s: PwSuite, fileTitle: string): void => {
    for (const spec of s.specs ?? []) {
      for (const t of spec.tests) {
        const last = t.results[t.results.length - 1];
        rows.push({
          file: fileTitle,
          title: spec.title,
          project: t.projectName,
          status: last?.status ?? 'missing',
          stdout: t.results.flatMap((x) => (x.stdout ?? []).map((o) => o.text ?? '')).join(''),
        });
      }
    }
    for (const c of s.suites ?? []) walk(c, fileTitle);
  };
  for (const s of json.suites) walk(s, s.title);
  return rows;
}

// ---------------------------------------------------------------- the checks

const startLoad = loadavg()[0] ?? 0;
const cores = cpus().length;
const t0 = Date.now();

const verify = run('verify-fast', ['node', 'tools/verify-fast.ts']);
const validation = vitest('validation', ['--project', 'validation']);
const golden = vitest('golden-node', ['--project', 'golden']);
const fuzz = vitest('fuzz', ['--project', 'fuzz']);
const lintTests = vitest('lint-rules', ['--project', 'unit', 'tests/unit/lint-rules.test.ts', 'tests/unit/depcruise-rules.test.ts']);
const dmath = vitest('dmath-full', ['--project', 'dmath-full'], quick);
const gpu = run('gpu', ['npm', 'run', 'test:gpu']);
const missions = run('missions', ['node', 'tools/missions-verify.ts']);
const e2e = run('e2e', quick ? ['npx', 'playwright', 'test', '--grep-invert', 'soak'] : ['npx', 'playwright', 'test'], { SOAK_MINUTES: '5' });
const pw = playwrightRows();
const build = run('build', ['sh', '-c', 'npm run build && npm run size:check']);
const endLoad = loadavg()[0] ?? 0;

const pwFind = (file: RegExp, title: RegExp, project?: string): PwRow[] =>
  pw.filter((r) => file.test(r.file) && title.test(r.title) && (project === undefined || r.project === project));
const pwOk = (rows: PwRow[]): boolean => rows.length > 0 && rows.every((r) => r.status === 'passed');
const pwSummary = (rows: PwRow[]): string =>
  rows.length === 0 ? 'not run' : `${rows.filter((r) => r.status === 'passed').length} of ${rows.length} passed`;

// ---------------------------------------------------------------- CI evidence
//
// Firefox through Playwright and the SwiftShader boot cannot be measured on this Mac
// (ADR 0009). CI runs both on Linux and uploads reports/playwright.json, so those items
// read it from the CI run of the exact commit being gated, and only when the working
// tree matches that commit.
interface CiRun {
  databaseId: number;
  conclusion: string;
  headSha: string;
  createdAt: string;
}
const GH = existsSync(`${homedir()}/.local/bin/gh`) ? `${homedir()}/.local/bin/gh` : 'gh';
// Name the repository: without --repo, gh asks the git on PATH, which may not run (Xcode licence).
const origin = spawnSync(GIT, ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).stdout.trim();
const repo = /github\.com[:/](.+?)(?:\.git)?$/.exec(origin)?.[1] ?? '';
const ciRun: CiRun | null = (() => {
  if (repo === '') return null;
  const p = spawnSync(GH, ['run', 'list', '--repo', repo, '--branch', 'main', '--workflow', 'CI', '--commit', head, '--limit', '1', '--json', 'databaseId,conclusion,headSha,createdAt'], { encoding: 'utf8' });
  return p.status === 0 ? ((JSON.parse(p.stdout) as CiRun[])[0] ?? null) : null;
})();
const ciPw: PwRow[] = (() => {
  if (ciRun === null || ciRun.conclusion !== 'success' || !clean) return [];
  const dir = `${LOGS}/ci-${ciRun.databaseId}`;
  const file = `${dir}/reports/playwright.json`;
  if (!existsSync(file)) spawnSync(GH, ['run', 'download', String(ciRun.databaseId), '--repo', repo, '--name', `reports-${ciRun.headSha}`, '--dir', dir], { encoding: 'utf8' });
  return playwrightRows(file);
})();
const ciLabel = ciRun === null ? '' : `CI run ${ciRun.databaseId} on ${ciRun.headSha.slice(0, 7)}, Linux`;
const ciFind = (file: RegExp, project: string): PwRow[] => ciPw.filter((r) => file.test(r.file) && r.project === project);
const ciMissing = ciRun === null
  ? `no CI run found for ${head.slice(0, 7)}`
  : !clean
    ? `the working tree differs from ${head.slice(0, 7)}, so CI evidence for that commit does not apply`
    : ciRun.conclusion !== 'success'
      ? `CI run ${ciRun.databaseId} on ${head.slice(0, 7)}: ${ciRun.conclusion || 'still running'}`
      : `CI run ${ciRun.databaseId} has no Playwright report`;

// ---------------------------------------------------------------- gate items

const phaseText = readFileSync('programme/phases/P00-foundations.md', 'utf8');
const gateSection = phaseText.split('## Gate')[1]?.split('\n## ')[0] ?? '';
const gateLines = gateSection
  .split('\n')
  .filter((l) => l.startsWith('- [ ]'))
  .map((l) => l.replace('- [ ] ', '').trim());
if (gateLines.length !== 11) throw new Error(`expected 11 gate items in the P00 phase file, found ${gateLines.length}`);

interface Item {
  readonly n: number;
  readonly text: string;
  readonly result: Result;
  readonly evidence: string[];
}

const items: Item[] = [];
function item(n: number, result: Result, evidence: string[]): void {
  items.push({ n, text: gateLines[n - 1] as string, result, evidence });
}

// 1. Every command in MASTER 13.1 exists, is real and passes.
{
  const verifyTime = Number(/verify:fast (?:passed|FAILED[^\n]*?) in ([\d.]+) s/.exec(verify.out)?.[1] ?? 'NaN');
  const ev: string[] = [];
  ev.push(`verify:fast: ${line(/verify:fast .*$/m, verify.out) || `exit ${verify.exit}`}`);
  ev.push(`test:validation: ${validation.json ? `${validation.json.numPassedTests} of ${validation.json.numTotalTests} passed` : 'no report'}; ${line(/M1 expected=.*$/m, validation.run.out)}`);
  ev.push(`test:golden (Node): ${golden.json ? `${golden.json.numPassedTests} of ${golden.json.numTotalTests} passed` : 'no report'}`);
  ev.push(`test:fuzz: ${fuzz.json ? `${fuzz.json.numPassedTests} of ${fuzz.json.numTotalTests} passed` : 'no report'}`);
  ev.push(`test:gpu: ${line(/advect: .*$/m, gpu.out) || `exit ${gpu.exit}`}; ${line(/ok src\/gpu.*$/m, gpu.out)}`);
  ev.push(`missions:verify: ${line(/missions:verify: .*$/m, missions.out) || `exit ${missions.exit}`}`);
  ev.push(`test:e2e (all Playwright specs${quick ? ', soak skipped' : ''}): ${pwSummary(pw)}`);
  for (const spec of ['smoke', 'device-loss', 'webgl', 'visual', 'replay', 'realtime', 'golden', 'soak']) {
    ev.push(`  ${spec}.spec: ${pwSummary(pw.filter((r) => r.file.includes(`${spec}.spec`)))}`);
  }
  ev.push(`build and size: ${line(/bundle gzip .*$/m, build.out) || `exit ${build.exit}`}`);
  const baseline = existsSync('docs/BASELINE.md') ? (/on (\d\d\/\d\d\/\d{4})/.exec(readFileSync('docs/BASELINE.md', 'utf8'))?.[1] ?? 'undated') : 'missing';
  ev.push(`perf:mac: not run by the gate (needs headed Chrome on Ricky's Mac); docs/BASELINE.md written ${baseline}`);
  if (verifyTime > 90) ev.push(`verify:fast took ${verifyTime} s, over its 90 s budget (load average ${startLoad.toFixed(0)} on ${cores} cores at the start)`);
  const allOk =
    verify.ok && validation.run.ok && golden.run.ok && fuzz.run.ok && gpu.ok && missions.ok && e2e.ok && build.ok &&
    pw.length > 0 && verifyTime <= 90 && baseline !== 'missing';
  item(1, quick ? 'not run' : allOk ? 'pass' : 'fail', ev);
}

// 2. Golden replay across Node runs, engines, the Mac's browsers, frame rates and time scales.
{
  const ev: string[] = [];
  const nodeRuns = vitestTest(golden.json, /three in-process runs/);
  const stubbed = vitestTest(golden.json, /stubbed worker|throw$/);
  const pacing = vitestTest(golden.json, /frame pacing/);
  ev.push(`Node, three runs: ${nodeRuns}; stubbed worker: ${stubbed}; 30/60/120/144 Hz x 0.01/1/100x: ${pacing}`);
  const engines: Record<string, PwRow[]> = {
    Chromium: pwFind(/golden\.spec/, /./, 'chromium'),
    WebKit: pwFind(/golden\.spec/, /./, 'webkit'),
    Firefox: pwFind(/golden\.spec/, /./, 'firefox'),
  };
  for (const [name, rows] of Object.entries(engines)) ev.push(`Playwright ${name}: ${pwSummary(rows)}`);
  if (engines['Firefox']?.length === 0 && process.platform === 'darwin') {
    // Firefox through Playwright does not start on this macOS (ADR 0009): take it from CI.
    const ci = ciFind(/golden\.spec/, 'firefox');
    if (ci.length > 0) engines['Firefox'] = ci;
    ev.push(`Playwright Firefox from ${ci.length > 0 ? `${ciLabel}: ${pwSummary(ci)}` : `CI: ${ciMissing}`}`);
  }
  type Native = Record<string, { matches?: boolean; finalHash?: string; ua?: string; date?: string }>;
  const native: Native = existsSync('reports/engines-native.json') ? (JSON.parse(readFileSync('reports/engines-native.json', 'utf8')) as Native) : {};
  for (const name of ['chrome', 'safari', 'firefox']) {
    const n = native[name];
    ev.push(`${name} on this Mac: ${n === undefined ? 'no evidence (tools/engine-check.ts)' : `${n.matches === true ? 'matches' : 'DIFFERS'} ${n.finalHash ?? ''} (${n.date ?? 'undated'})`}`);
  }
  const anyMismatch =
    [nodeRuns, stubbed, pacing].some((s) => s === 'failed') ||
    Object.values(engines).some((rows) => rows.some((r) => r.status === 'failed')) ||
    Object.values(native).some((n) => n.matches === false);
  const nodeOk = [nodeRuns, stubbed, pacing].every((s) => s === 'passed');
  const playwrightComplete = Object.values(engines).every(pwOk);
  const nativeComplete = native['chrome']?.matches === true && native['safari']?.matches === true;
  let result: Result = 'pass';
  if (anyMismatch || !nodeOk) result = 'fail';
  else if (!playwrightComplete || !nativeComplete) result = 'blocked';
  item(2, result, ev);
}

// 3. Snapshot at tick 300, restore, run 600 ticks.
{
  const s = vitestTest(golden.json, /snapshot at tick 300/);
  item(3, s === 'passed' ? 'pass' : 'fail', [`tests/golden/node.test.ts "snapshot at tick 300, restore, run on": ${s}`]);
}

// 4. Lint blocks the banned forms (a test proves each rule fires) and the throwing stubs are active.
{
  const stubs = vitestTest(golden.json, /stubbed worker is live/);
  const lintOk = lintTests.json !== null && lintTests.json.numFailedTests === 0 && lintTests.json.numPassedTests > 0;
  item(4, lintOk && stubs === 'passed' ? 'pass' : 'fail', [
    `tests/unit/lint-rules.test.ts and depcruise-rules.test.ts: ${lintTests.json ? `${lintTests.json.numPassedTests} of ${lintTests.json.numTotalTests} passed` : 'no report'}`,
    `throwing stubs active in the golden worker: ${stubs}`,
  ]);
}

// 5. Every dmath function within 2 ulp over a million samples.
{
  const rows = [...dmath.run.out.matchAll(/dmath\.(\w+) samples=(\d+) maxUlp=([\d.]+)/g)].map((m) => ({ fn: m[1] as string, samples: Number(m[2]), ulp: Number(m[3]) }));
  const ok = rows.length === 19 && rows.every((r) => r.samples >= 1_000_000 && r.ulp <= 2) && dmath.run.ok;
  const worst = rows.slice().sort((a, b) => b.ulp - a.ulp)[0];
  item(5, !dmath.run.ran ? 'not run' : ok ? 'pass' : 'fail', [
    `${rows.length} of 19 functions measured; ${rows.filter((r) => r.ulp <= 2).length} within 2 ulp${worst ? `; worst ${worst.fn} ${worst.ulp} ulp` : ''}`,
    rows.map((r) => `${r.fn} ${r.ulp}`).join(', '),
  ]);
}

// 6. E2E: interactive within 30 s under SwiftShader, zero console errors, pixel readback, device loss.
{
  const smoke = pwFind(/smoke\.spec/, /./, 'chromium');
  const loss = pwFind(/device-loss\.spec/, /./, 'chromium');
  const boot = /boot (\d+) ms, backend (\w+)/.exec(smoke.map((r) => r.stdout).join('\n'));
  const swiftshader = process.platform !== 'darwin' || process.env['PS_SWIFTSHADER'] === '1';
  const ev = [
    `smoke (boot, pixel readback, zero console errors): ${pwSummary(smoke)}${boot ? `; boot ${boot[1]} ms on ${boot[2]}` : ''}`,
    `device loss (state intact, D-001, D-002, D-010): ${pwSummary(loss)}`,
    swiftshader
      ? `adapter: SwiftShader${boot ? `; boot ${boot[1]} ms against the 30 s budget` : ''}`
      : 'adapter: the real GPU; SwiftShader loses the device at first present on macOS (ADR 0009), so the 30 s SwiftShader boot is measured in CI on Linux',
  ];
  const e2eOk = pwOk(smoke) && pwOk(loss);
  let result: Result = e2eOk ? 'pass' : 'fail';
  if (e2eOk && !swiftshader) {
    // The SwiftShader measurement comes from CI on the same commit.
    const ciSmoke = ciFind(/smoke\.spec/, 'chromium');
    const ciLoss = ciFind(/device-loss\.spec/, 'chromium');
    const ciBoot = /boot (\d+) ms, backend (\w+)/.exec(ciSmoke.map((r) => r.stdout).join('\n'));
    if (ciSmoke.length === 0) {
      ev.push(`SwiftShader from CI: ${ciMissing}`);
      result = 'blocked';
    } else {
      ev.push(
        `SwiftShader from ${ciLabel}: smoke ${pwSummary(ciSmoke)}${ciBoot ? `, boot ${ciBoot[1]} ms on ${ciBoot[2]} against the 30 s budget` : ', no boot time logged'}; device loss ${pwSummary(ciLoss)}`,
      );
      result = pwOk(ciSmoke) && pwOk(ciLoss) && ciBoot !== null && Number(ciBoot[1]) <= 30_000 ? 'pass' : 'fail';
    }
  }
  if (e2eOk && swiftshader && boot && Number(boot[1]) > 30_000) result = 'fail';
  item(6, result, ev);
}

// 7. The WebGL2 fallback boots and draws the cube.
{
  const rows = pwFind(/webgl\.spec/, /./, 'chromium');
  item(7, pwOk(rows) ? 'pass' : 'fail', [`tests/e2e/webgl.spec.ts: ${pwSummary(rows)}`]);
}

// 8. CI is green on main; deployment works if Ricky approved it.
{
  const remotes = spawnSync(GIT, ['remote'], { encoding: 'utf8' }).stdout.trim();
  const workflows = ['ci', 'nightly', 'deploy'].filter((n) => existsSync(`.github/workflows/${n}.yml`));
  if (remotes === '') {
    item(8, 'blocked', [`workflows present: ${workflows.join(', ')}`, 'no git remote: CI has never run (needs Ricky\'s answers to Q1 and Q2 in docs/PROGRESS.md)']);
  } else {
    item(8, ciRun === null || ciRun.conclusion === '' ? 'blocked' : ciRun.conclusion === 'success' ? 'pass' : 'fail', [
      `remote: ${remotes}`,
      ciRun === null
        ? `no CI run found on main for ${head.slice(0, 7)} (gh unavailable, or the commit is not pushed)`
        : `CI run ${ciRun.databaseId} on main for ${ciRun.headSha.slice(0, 7)}: ${ciRun.conclusion || 'still running'} (${ciRun.createdAt})`,
      'deployment: only once Ricky approves publishing (DEPLOY_APPROVED)',
    ]);
  }
}

// 9. Hooks, subagents and skills work, with evidence in the report.
{
  const proofPath = `docs/phases/${phase}-hook-proof.md`;
  const proof = existsSync(proofPath) ? readFileSync(proofPath, 'utf8') : '';
  const needed = ['PostToolUse hook (live session)', 'Stop hook (live session)', 'Scoped rules (live session)', 'Subagent (live session)', 'Skill (live session)'];
  const present = needed.filter((h) => proof.includes(`## ${h}`));
  const agents = existsSync('.claude/agents') ? readdirSync('.claude/agents').filter((f) => f.endsWith('.md')).length : 0;
  const skills = existsSync('.claude/skills') ? readdirSync('.claude/skills').filter((d) => existsSync(`.claude/skills/${d}/SKILL.md`)).length : 0;
  const missing = needed.filter((h) => !present.includes(h));
  item(9, missing.length === 0 && agents >= 5 && skills >= 5 ? 'pass' : 'fail', [
    `${proofPath}: ${present.length} of ${needed.length} live-evidence sections${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`,
    `on disk: ${agents} subagents in .claude/agents, ${skills} skills in .claude/skills`,
  ]);
}

// 10. Spike ADRs with measured numbers; tick decision recorded.
{
  const spikes: Array<[string, string]> = [
    ['S1', '0004-spike-s1-rapier'],
    ['S2', '0007-spike-s2-renderer'],
    ['S3', '0008-spike-s3-hud'],
    ['S4', '0009-spike-s4-test-stack'],
    ['S5', '0006-dmath'],
    ['S6', '0005-tick-rate'],
  ];
  const ev: string[] = [];
  let ok = true;
  for (const [s, f] of spikes) {
    const p = `docs/adr/${f}.md`;
    const text = existsSync(p) ? readFileSync(p, 'utf8') : '';
    const numbers = (text.match(/\d+(\.\d+)? ?(ms|MB|KB|bytes|ns|ulp|Hz|%)/g) ?? []).length;
    if (text === '' || numbers === 0) ok = false;
    ev.push(`${s} ${p}: ${text === '' ? 'missing' : `${numbers} measured values${/partial|not yet measured/i.test(text) ? ', partial (see the ADR)' : ''}`}`);
  }
  const tick = existsSync('docs/adr/0005-tick-rate.md') && /Decision: default tick 1\/120 s/.test(readFileSync('docs/adr/0005-tick-rate.md', 'utf8'));
  if (!tick) ok = false;
  ev.push(`tick decision recorded: ${tick ? 'yes, 1/120 s with two substeps (ADR 0005)' : 'no'}`);
  item(10, ok ? 'pass' : 'fail', ev);
}

// 11. perf:mac baseline recorded in docs/BASELINE.md.
{
  const text = existsSync('docs/BASELINE.md') ? readFileSync('docs/BASELINE.md', 'utf8') : '';
  const rows = text.split('\n').filter((l) => /^\| [a-z0-9-]+ \|/.test(l));
  const over = rows.filter((l) => /over budget/i.test(l));
  item(11, rows.length > 0 ? 'pass' : 'fail', [
    rows.length > 0 ? `${rows.length} scenes recorded (${/on (\d\d\/\d\d\/\d{4})/.exec(text)?.[1] ?? 'undated'})` : 'no baseline rows',
    over.length > 0 ? `over budget: ${over.map((l) => l.split('|')[1]?.trim()).join(', ')} (recorded, not hidden)` : 'no value over budget',
  ]);
}

// ---------------------------------------------------------------- report

const counts = { pass: 0, fail: 0, blocked: 0, 'not run': 0 } as Record<Result, number>;
for (const it of items) counts[it.result]++;
const commit = head.slice(0, 7) || 'uncommitted';
// The tree as it was when the checks started; the golden spec rewrites reports/engines.json during the run.
const dirty = !clean;
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const physics = /PHYSICS_VERSION = '([^']+)'/.exec(readFileSync('src/sim/version.ts', 'utf8'))?.[1] ?? '?';
const d = new Date();
const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const minutes = ((Date.now() - t0) / 60000).toFixed(1);
const cell = (s: string): string => s.replace(/\|/g, '/').replace(/\n/g, ' ');

const defects = existsSync('docs/DEFECTS.md')
  ? readFileSync('docs/DEFECTS.md', 'utf8').split('\n').filter((l) => /^\| D-\d+/.test(l)).map((l) => {
      const c = l.split(' | ');
      return `| ${c[0]?.replace('| ', '')} | ${c[2] ?? ''} | ${(c[3] ?? '').split('. ')[0]?.slice(0, 160) ?? ''} |`;
    })
  : [];

const playtest = (phaseText.split("## Ricky's playtest")[1] ?? '').split('\n## ')[0] ?? '';
const lines = [
  `# ${phase} ${review ? 'independent review run' : 'report'} - Foundations`,
  '',
  `Date ${date}, programme version 1.0.0, physics version ${physics}, game version ${pkg.version}, commit ${commit}${dirty ? ' (with uncommitted changes)' : ''}.`,
  `Machine: ${process.platform} ${process.arch}, ${cores} cores; load average ${startLoad.toFixed(1)} at the start and ${endLoad.toFixed(1)} at the end; run time ${minutes} minutes${quick ? '; quick run (long checks skipped), not valid for closing the gate' : ''}.`,
  '',
  '## Summary',
  '',
  `${counts.pass} of ${items.length} gate items pass, ${counts.fail} fail, ${counts.blocked} blocked, ${counts['not run']} not run. ${
    counts.pass === items.length
      ? 'Every item has its evidence.'
      : 'Blocked items need evidence this machine cannot produce (CI on Linux, or Ricky); they are not passes and closing the gate without them needs Ricky\'s written waiver.'
  }`,
  '',
  '## Gate table',
  '',
  '| # | Gate item (from the phase file) | Result | Evidence |',
  '|---|---|---|---|',
  ...items.map((it) => `| ${it.n} | ${cell(it.text)} | ${it.result} | ${it.evidence.map(cell).join('<br>')} |`),
  '',
  '## Benches',
  '',
  '| id | expected | measured | error | pass |',
  '|---|---|---|---|---|',
  (() => {
    const m = /M1 expected=([\d.]+) measured=([\d.]+) error=([\d.]+)%/.exec(validation.run.out);
    return m ? `| M1 free fall, drop in 2 s (m) | ${m[1]} | ${m[2]} | ${m[3]}% (tolerance 0.5%) | ${Number(m[3]) <= 0.5 ? 'pass' : 'fail'} |` : '| M1 | | | not run | |';
  })(),
  '',
  '## Missions',
  '',
  'None in P00 (missions:verify is wired with an empty set).',
  '',
  '## Performance',
  '',
  existsSync('docs/BASELINE.md') ? readFileSync('docs/BASELINE.md', 'utf8').split('\n').filter((l) => l.startsWith('|')).join('\n') : 'Not measured.',
  '',
  '## Defects',
  '',
  '| id | status | summary |',
  '|---|---|---|',
  ...(defects.length > 0 ? defects : ['| none | | |']),
  '',
  review ? '## Reviewer findings\n\n(The reviewer writes findings here.)' : '## Gate-reviewer findings\n\nSee the latest docs/phases/P00-review.md and the defects above.',
  '',
  "## Playtest checklist for Ricky",
  playtest.trimEnd(),
  '',
  ...(review
    ? []
    : [
        'Until Ricky approves GitHub Pages (Q2b in docs/PROGRESS.md) there is no deployed page: play the local build instead (`npm run dev`, then the printed address in Chrome and in Safari).',
        '',
      ]),
  `Logs and structured results: ${LOGS}/ and reports/playwright.json.`,
  '',
];
const out = `docs/phases/${phase}-${review ? 'review' : 'report'}.md`;
writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out}: ${counts.pass} pass, ${counts.fail} fail, ${counts.blocked} blocked, ${counts['not run']} not run`);
process.exit(counts.fail > 0 ? 1 : 0);
