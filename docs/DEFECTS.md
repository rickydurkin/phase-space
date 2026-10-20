# Defects

IDs are D-001 onwards and are never reused. Each defect gets a failing regression test named after it before the fix (MASTER 3.2).

| ID | Opened | Status | Summary | Regression test |
|---|---|---|---|---|
| D-001 | 16/10/2026 | closed 20/10/2026 | When the GPU process is killed (Browser.crashGpuProcess), three.js WebGPURenderer's pending popErrorScope promise rejects with "OperationError: Instance dropped in popErrorScope" as an unhandled rejection before our device-loss recovery runs; the page recovers and the state is intact, but the error overlay shows the rejection. Not seen with device.destroy(). | tests/e2e/device-loss.spec.ts, "D-001: GPU process crash..." (no rejection tolerated). Cause: three.js 0.186 calls device.popErrorScope().then() without a rejection handler during pipeline creation. Fix: src/render/renderer.ts guardErrorScopes resolves only that rejection to null on our device and reports the count in the recovery note. Evidence: tightened test failed 1 of 8 runs before the fix, passed 8 of 8 after. |
