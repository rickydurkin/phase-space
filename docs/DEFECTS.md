# Defects

IDs are D-001 onwards and are never reused. Each defect gets a failing regression test named after it before the fix (MASTER 3.2).

| ID | Opened | Status | Summary | Regression test |
|---|---|---|---|---|
| D-001 | 16/10/2026 | open (upstream) | When the GPU process is killed (Browser.crashGpuProcess), three.js WebGPURenderer's pending popErrorScope promise rejects with "OperationError: Instance dropped in popErrorScope" as an unhandled rejection before our device-loss recovery runs; the page recovers and the state is intact, but the error overlay shows the rejection. Not seen with device.destroy(). | tests/e2e/device-loss.spec.ts (CDP crash test; the rejection is tolerated there with a reference to this id until three.js handles it or the renderer wraps the error-scope calls) |
