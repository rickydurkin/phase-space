# 0009 Spike S4: the test stack (Playwright, SwiftShader, Dawn, device loss, WGSL validation)
Status: accepted (15/10/2026)

Context: P00 WP0.2 S4 asks for Playwright with SwiftShader WebGPU pixel readback and screenshots, a Dawn-in-Node compute kernel against its CPU reference, device loss through Browser.crashGpuProcess, and a WGSL validator.

Measurements (15/10/2026, Apple M4 Max, macOS 27.0.1, Playwright 1.64.1, Chromium 156):

- SwiftShader WebGPU on macOS: raw adapter and device work (MSAA 4, depth and float textures, canvas configure all succeed), but the first canvas present loses the device ("A valid external Instance reference no longer exists") in the Chromium headless shell and in full Chromium new headless alike. The same flags were verified on Linux in the research snapshot (14/10/2026), which is where CI runs. Decision: CI (Linux) uses the headless shell with the SwiftShader flags; macOS uses full Chromium in new headless mode on the real GPU (`channel: 'chromium'`); PS_SWIFTSHADER=1 and PS_REAL_GPU=1 override. The 30 s SwiftShader boot budget is therefore a CI measurement, pending the first CI run; the real-GPU boot measured here is 282 to 1,242 ms.
- Pixel readback: the test API renders into a RenderTarget and reads it back (three's readRenderTargetPixelsAsync), tight RGBA rows top first; on WebGL2 ANGLE emits a "GPU stall due to ReadPixels" performance warning, allowlisted with its reason in tests/console-allowlist.json. Screenshots are taken as the secondary record (reports/screenshots, reports/visual).
- Device loss: `device.destroy()` through the test API and `Browser.crashGpuProcess` through CDP both recover with the simulation state intact (tests/e2e/device-loss.spec.ts); Chromium logs the instance loss as a console warning during the deliberate crash, ignored only inside that test.
- Dawn in Node: the advection kernel runs through webgpu 0.6.2 on the Metal adapter and matches its CPU reference within 1 f32 ulp (79% bit-exact; fused multiply-add on the GPU). Dawn's native module crashes inside Vitest's forked worker, so GPU tests run under node:test (ADR 0003), and a device must be destroyed before the process exits.
- WGSL validation: tools/wgsl-validate.ts reports errors with line and column (negative control: the error at line 3 about giving a let of type f32 a u32 value); the PostToolUse hook runs it on every .wgsl edit.
- Engines: the golden replay reproduces the Node hashes in Chromium (V8) and WebKit (JavaScriptCore, Safari 27.2 build) for cube-drop (1,200 ticks) and stack-1000 (1,000 bodies, 120 ticks). Playwright's Firefox 157 Nightly build does not start on this macOS ("Could not find profile folder" headless, a sandbox extension failure headed, unchanged with Firefox's sandboxes disabled); the Firefox check runs in CI on Linux and in the nightly macOS and Windows runners.
- Console hygiene caught a real defect class on the first run: the browser's automatic favicon request returned 404, logged as a console error; index.html and replay.html now declare an empty icon.

Consequences: two Chromium modes to keep in step (SwiftShader in CI, Metal locally) with per-adapter visual baselines named by platform and adapter class. Firefox determinism is not yet evidenced on any machine; the first CI run closes that gap or opens a defect.

Verification: `npm run test:e2e`, `npm run test:golden`, `npm run test:gpu`, `node tools/wgsl-validate.ts`.
