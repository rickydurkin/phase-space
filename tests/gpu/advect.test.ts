// Runs with node:test, not Vitest: Dawn's native module crashes with SIGSEGV
// inside Vitest's forked worker (docs/adr/0003-gpu-tests-node-test.md).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withDevice } from './dawn.ts';
import { advectReference } from '../../src/gpu/reference/advect.ts';

const wgsl = readFileSync(new URL('../../src/gpu/kernels/advect.wgsl', import.meta.url), 'utf8');

describe('GPU kernel: particle advection (Dawn in Node)', () => {
  it('validates and matches the CPU reference', async () => {
    await withDevice(async (device, info) => {
    console.log(`adapter: ${info}`);
    device.pushErrorScope('validation');
    const module = device.createShaderModule({ code: wgsl });
    const compile = await module.getCompilationInfo();
    const errors = compile.messages.filter((m) => m.type === 'error');
    assert.deepEqual(errors, [], errors.map((e) => `${e.lineNum}:${e.linePos} ${e.message}`).join('\n'));
    assert.equal(await device.popErrorScope(), null);

    const count = 4096;
    const dt = 1 / 60;
    const bound = 2;
    const pos = new Float32Array(count * 4);
    const vel = new Float32Array(count * 4);
    let s = 12345;
    const rnd = (): number => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < count * 4; i++) {
      pos[i] = (rnd() * 2 - 1) * bound;
      vel[i] = (rnd() * 2 - 1) * 50;
    }
    const expected = advectReference(pos, vel, dt, bound, count);

    const params = new ArrayBuffer(16);
    const pv = new DataView(params);
    pv.setFloat32(0, dt, true);
    pv.setUint32(4, count, true);
    pv.setFloat32(8, bound, true);
    const paramBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(paramBuf, 0, params);
    const velBuf = device.createBuffer({ size: vel.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(velBuf, 0, vel.buffer);
    const posBuf = device.createBuffer({
      size: pos.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    device.queue.writeBuffer(posBuf, 0, pos.buffer);
    const readBuf = device.createBuffer({ size: pos.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

    const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
    const bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: paramBuf } },
        { binding: 1, resource: { buffer: velBuf } },
        { binding: 2, resource: { buffer: posBuf } },
      ],
    });
    const enc = device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bind);
    pass.dispatchWorkgroups(Math.ceil(count / 64));
    pass.end();
    enc.copyBufferToBuffer(posBuf, 0, readBuf, 0, pos.byteLength);
    device.queue.submit([enc.finish()]);
    await readBuf.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuf.getMappedRange().slice(0));
    readBuf.unmap();

    let maxDiff = 0;
    let exact = 0;
    for (let i = 0; i < result.length; i++) {
      const d = Math.abs((result[i] as number) - (expected[i] as number));
      if (d === 0) exact++;
      if (d > maxDiff) maxDiff = d;
    }
    console.log(`advect: ${count} particles, exact matches ${exact}/${result.length}, max abs diff ${maxDiff}`);
    // GPUs may fuse p + v * dt into one rounding (WGSL allows it; Metal does), so a
    // 1 ulp f32 difference is expected on some elements. Values are within [-2, 2),
    // where one f32 ulp is 2.4e-7. Results never enter the AS (MASTER 2.3).
    assert.ok(maxDiff <= 2 * 2.384185791015625e-7, `max abs diff ${maxDiff} exceeds 2 f32 ulp`);
    assert.ok(exact / result.length > 0.5, `only ${exact} exact matches`);
    });
  });
});
