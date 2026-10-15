// Shared Dawn (WebGPU in Node) setup for GPU tests. Each test creates and
// destroys its own device inside the test body: a device that outlives the
// test (module-level or top-level await) makes the process abort at exit with
// "mutex lock failed" (measured 15/10/2026, webgpu 0.6.2, Node 26.8.2).
import { create, globals } from 'webgpu';

let installed = false;

export async function withDevice<T>(fn: (device: GPUDevice, info: string) => Promise<T>): Promise<T> {
  if (!installed) {
    Object.assign(globalThis, globals);
    installed = true;
  }
  const gpu = create([]) as unknown as GPU;
  const adapter = await gpu.requestAdapter();
  if (adapter === null) throw new Error('Dawn returned no WebGPU adapter');
  const a = adapter.info;
  const info = `${a.vendor} ${a.architecture} ${a.device} ${a.description}`.trim();
  const device = await adapter.requestDevice();
  try {
    return await fn(device, info);
  } finally {
    device.destroy();
  }
}
