#!/usr/bin/env node
// Claude Code Stop hook: runs verify:fast once per stop. If it fails, blocks
// the stop with the tail of the log so the agent fixes it. The hook reads
// stop_hook_active and lets the second stop through, so Claude can always
// stop to report or ask Ricky (MASTER 13.5; then follow 3.3 on wip/ branches).
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
let active;
try {
  active = JSON.parse(input)?.stop_hook_active === true;
} catch {
  active = false;
}
if (active) process.exit(0);

const r = spawnSync('npm', ['run', 'verify:fast'], { encoding: 'utf8', shell: process.platform === 'win32' });
const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
mkdirSync('reports', { recursive: true });
writeFileSync('reports/verify-fast.log', out);
if ((r.status ?? 1) !== 0) {
  const tail = out.split('\n').slice(-40).join('\n');
  console.error(`verify:fast failed. Fix it before stopping, or if it cannot be fixed this session, commit to a wip/ branch and only docs/PROGRESS.md to main (MASTER 3.3). Full log: reports/verify-fast.log\n${tail}`);
  process.exit(2);
}
process.exit(0);
