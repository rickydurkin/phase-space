// Negative control for the GPU harness: a broken kernel must be reported.
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { withDevice } from './dawn.ts';

it('WGSL validation reports an error with a line number for a broken kernel', async () => {
  await withDevice(async (device) => {
  const broken = `@compute @workgroup_size(64)\nfn main() {\n  let x: f32 = 1u;\n}\n`;
  device.pushErrorScope('validation');
  const module = device.createShaderModule({ code: broken });
  const info = await module.getCompilationInfo();
  await device.popErrorScope();
  const errors = info.messages.filter((m) => m.type === 'error');
  assert.ok(errors.length > 0, 'expected at least one compilation error');
  assert.equal(errors[0]?.lineNum, 3);
  });
});
