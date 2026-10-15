// Validate every WGSL file (or the files given) with Dawn's compiler and print
// errors with line numbers. Exit 1 on any error. Used by the PostToolUse hook.
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { create, globals } from 'webgpu';

const files = process.argv.slice(2).length > 0 ? process.argv.slice(2) : globSync('src/gpu/**/*.wgsl');
if (files.length === 0) {
  console.log('wgsl-validate: no WGSL files');
  process.exit(0);
}
Object.assign(globalThis, globals);
const gpu = create([]) as unknown as GPU;
const adapter = await gpu.requestAdapter();
if (adapter === null) {
  console.error('ERROR wgsl-validate: no WebGPU adapter from Dawn');
  process.exit(1);
}
const device = await adapter.requestDevice();
let failed = 0;
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  device.pushErrorScope('validation');
  const module = device.createShaderModule({ code });
  const info = await module.getCompilationInfo();
  await device.popErrorScope();
  const errors = info.messages.filter((m) => m.type === 'error');
  for (const m of errors) console.error(`ERROR ${file}:${m.lineNum}:${m.linePos} ${m.message}`);
  for (const m of info.messages.filter((m) => m.type === 'warning')) console.warn(`WARN ${file}:${m.lineNum}:${m.linePos} ${m.message}`);
  if (errors.length > 0) failed++;
  else console.log(`ok ${file}`);
}
device.destroy();
process.exit(failed > 0 ? 1 : 0);
