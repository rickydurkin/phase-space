#!/usr/bin/env node
// Claude Code PostToolUse hook (Edit, Write, MultiEdit): fast typecheck for .ts
// files, WGSL validation for .wgsl files. Prints the first 40 error lines and
// exits 2 so the errors are fed back to Claude (MASTER 13.5).
import { spawnSync } from 'node:child_process';

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
let filePath = '';
try {
  const data = JSON.parse(input);
  filePath = data?.tool_input?.file_path ?? data?.tool_input?.path ?? '';
} catch {
  process.exit(0);
}
if (filePath === '') process.exit(0);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

let result = null;
if (/\.(ts|tsx|mts|cts)$/.test(filePath) && !/\.d\.ts$/.test(filePath)) {
  const config = filePath.includes('/src/sim/')
    ? 'tsconfig.sim.json'
    : /\/(tools|tests)\//.test(filePath) || /\.config\.ts$/.test(filePath)
      ? 'tsconfig.node.json'
      : 'tsconfig.app.json';
  result = run('npx', ['tsc', '-p', config, '--pretty', 'false']);
} else if (/\.wgsl$/.test(filePath)) {
  result = run('node', ['tools/wgsl-validate.ts', filePath]);
}
if (result === null) process.exit(0);
if (result.code !== 0) {
  const lines = result.out.split('\n').filter((l) => l.trim() !== '').slice(0, 40);
  console.error(`post-edit hook: check failed for ${filePath}\n${lines.join('\n')}`);
  process.exit(2);
}
process.exit(0);
