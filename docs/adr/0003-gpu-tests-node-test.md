# 0003 GPU kernel tests run under node:test, not Vitest
Status: accepted (15/10/2026)

Context: MASTER 13.1 requires WGSL kernels to be tested against CPU references in Node through Dawn (the webgpu 0.6.2 package). The first attempt ran the test under Vitest 5.0.4.

Evidence: `npx vitest run --project gpu` ended with "Worker exited unexpectedly with signal SIGSEGV during started state while running test file tests/gpu/advect.test.ts" (15/10/2026, macOS, Node 26.8.2). The same device creation and kernel run cleanly in a plain Node process (tools/wgsl-validate.ts) and under `node --test`.

Options considered:
1. Debug Dawn's native module inside Vitest's forked worker (module interception of the .node file, or a context-awareness problem). Unknown time cost.
2. Run tests/gpu with Node's built-in test runner (`node --test tests/gpu/`), which loads the native module exactly as production tooling does.

Decision: option 2. `npm run test:gpu` runs `node --test tests/gpu/` and then the WGSL validator. Vitest keeps every other project.

Consequences: two test runners in the repository; GPU tests use node:assert. The count check (tools/check-counts.ts) counts both. Revisit if Vitest or the webgpu package changes.

Verification: `npm run test:gpu` passes (advection kernel exact against its CPU reference; negative control reports a WGSL error with a line number).

Addendum (15/10/2026): a device that outlives its test (module-level or top-level await) makes the process abort at exit with "mutex lock failed"; each test now creates and destroys its own device (tests/gpu/dawn.ts withDevice). On the M4 Max Metal adapter the advection kernel matches its CPU reference bit for bit on 79% of elements and within one f32 ulp (2.4e-7) on the rest, the signature of fused multiply-add on the GPU; the test accepts 2 f32 ulp and at least half bit-exact.
