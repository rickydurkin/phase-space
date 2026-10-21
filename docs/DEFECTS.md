# Defects

IDs are D-001 onwards and are never reused. Each defect gets a failing regression test named after it before the fix (MASTER 3.2).

| ID | Opened | Status | Summary | Regression test |
|---|---|---|---|---|
| D-001 | 16/10/2026 | closed 20/10/2026 | When the GPU process is killed (Browser.crashGpuProcess), three.js WebGPURenderer's pending popErrorScope promise rejects with "OperationError: Instance dropped in popErrorScope" as an unhandled rejection before our device-loss recovery runs; the page recovers and the state is intact, but the error overlay shows the rejection. Not seen with device.destroy(). | tests/e2e/device-loss.spec.ts, "D-001: GPU process crash..." (no rejection tolerated). Cause: three.js 0.186 calls device.popErrorScope().then() without a rejection handler during pipeline creation. Fix: src/render/renderer.ts guardErrorScopes resolves only that rejection to null on our device and reports the count in the recovery note. Evidence: tightened test failed 1 of 8 runs before the fix, passed 8 of 8 after. |
| D-002 | 21/10/2026 | closed 21/10/2026 | Gate review: after WebGPU device-loss recovery the orbit camera no longer responds to drag, two-finger scroll or pinch. The renderer replaces its canvas in recover(), but the OrbitCameraController (src/app/main.ts) keeps its listeners on the old, detached canvas; the new canvas also lacks the wheel preventDefault, so a trackpad pinch would zoom the page instead. Simulation state is intact. Details below. Fix: the renderer reports the replacement canvas (onCanvasReplaced) and OrbitCameraController.attach() moves the pointer and wheel listeners, including the non-passive wheel handler, to it. | tests/e2e/device-loss.spec.ts 'D-002: the orbit camera still responds after device-loss recovery': with re-binding disabled the view changed by 0.016 after recovery and the test failed; with the fix it passes (21/10/2026). |
| D-003 | 21/10/2026 | closed 21/10/2026 | Gate review: after pressing R the HUD shows two different hashes. The "hash" row holds the hash of the last tick divisible by 60, the replay line shows the replay hash at the current tick, and the original run's hash at that tick is never shown, so Ricky's playtest step 2 ("check the HUD shows matching hashes") shows non-matching strings. The "hash" row is not the current hash the WP0.5 HUD stub asks for. R also does not replay anything visibly: the cube stays where it is (whether R should show the fall again is Ricky's call). Details below. Fix: R now rebuilds the run from its scene, seed and input log and plays it visibly from tick 0 (4 s at the current time scale, then fast-forward) to the tick where R was pressed; there the worker compares the replay hash with the original run's hash at that same tick and the HUD shows one result line. The hash row reads 'hash at tick: <hash> @ <tick>' and is exact while paused. Ricky's call on whether R should show the fall again was taken as yes, because the P00 playtest says 'Press R to replay'; it can be reversed. | tests/e2e/replay.spec.ts, two 'D-003' tests: the cube rises above 1.5 m during the replay, the match line names tick 400 and the original hash, the paused run ends at the same tick and hash; a replay with an impulse in the log matches and keeps running. Without the fix both fail (21/10/2026). |
| D-004 | 21/10/2026 | closed 21/10/2026 | Gate review: the src/sim determinism lint rules can be bypassed. `const { sin } = Math`, `const M = Math; M.sin(1)`, `globalThis.Math.sin(1)`, `globalThis.Date.now()`, `globalThis.performance.now()` and `Reflect.get(Math, 'random')()` give no sim/* error in src/sim (MASTER 5.4: every non-allowlisted Math function, Date and performance.now is a lint error). The golden worker's throwing stubs catch these only on code paths the golden replay runs. Details below. Fix: tools/eslint/plugin-sim.js now reports any use of Math other than Math.<allowlisted member> (aliasing, destructuring, passing it), and bans globalThis, self, global, Reflect, eval, Function, Proxy, WeakRef, FinalizationRegistry, Intl, Atomics, SharedArrayBuffer, process and require in src/sim; type-only references stay allowed. tests/unit/depcruise-rules.test.ts proves the boundary rules fire. | tests/unit/lint-rules.test.ts, 14 'D-004' probes (all six bypasses from the review plus self, eval, Function, WeakRef, Intl and Math passed as an argument) and two positive controls: 13 probes fail with the old plugin, all pass with the fix; tests/unit/depcruise-rules.test.ts, 5 tests (21/10/2026). |
| D-005 | 21/10/2026 | closed 21/10/2026 | Gate review: Simulation.queueInput accepts an input for an entity that does not exist; when its tick arrives applyInput throws inside step(), the game stops ("Simulation stopped after an error") and the bad input stays in the input log, so a replay of that run throws too. Inputs (and replay files, MASTER 5.5) should be validated when queued. Reachable only through the test API and replay files in P00. Details below. Fix: Simulation.queueInput validates every input when it arrives (whole non-negative tick not in the past, a live entity with a rigid body, finite values, a known type) and stores a copy; the worker validates replay files with the zod ReplayFileSchema. | tests/unit/inputs.test.ts, 5 tests: unknown entity, non-finite values, bad ticks and unknown types are rejected with the simulation still stepping; the stored copy cannot be changed by the caller; a replay file with a bad input fails at load. 3 of the 5 fail on the old queueInput (21/10/2026). |
| D-006 | 21/10/2026 | closed 21/10/2026 | Gate review: the soak heap check is looser than MASTER 12 (heap flat within 5%). tests/e2e/soak.spec.ts allows `last <= first * 1.05 + 2` MB, which on a 5.7 MB heap lets the heap grow by about 40%; it compares the first and last settled samples rather than the maximum its comment names; GPU resource counts (MASTER 13.1 test:soak) are not tracked. No "Approved by Ricky" ADR changes this budget, so the 5% value applies (MASTER 0). Fix: tests/e2e/soak.spec.ts now applies MASTER 12 exactly: after a minute of warm-up the spread of the JS heap samples (largest minus smallest) must be within 5% of the smallest, and the live GPU geometry and texture counts (new test API gpuResources(), from three.js renderer.info) must be flat too; the soak also exercises the visible replay. The worker now frees Rapier worlds when it replaces a simulation. | tests/e2e/soak.spec.ts, 5-minute run on 21/10/2026: 210 actions, heap 5.74 to 5.88 MB after warm-up (2.4% spread), GPU geometries 3 and textures 6 throughout; passed. |
| D-007 | 21/10/2026 | open | Gate review: tools/gate.ts reports gate items as pass without the evidence the P00 gate requires. G2b passes with Firefox not run and no Chrome or Safari run on Ricky's Mac; G14 passes while CI has never run ("CI is green on main"); G15 passes on the existence of two files and prints hardcoded counts ("agents 5, skills 5") and a Stop-hook claim that docs/phases/P00-hook-proof.md does not contain; G6 passes with no SwiftShader measurement. Its vitest evidence pattern does not match vitest's coloured output, so the G2, G3 and G9 evidence cells are empty or "exit 0". Details below. | none yet |
| D-008 | 21/10/2026 | closed 21/10/2026 | Gate review: tests/e2e/visual.spec.ts writes a missing baseline and passes. No linux-swiftshader baselines are committed, so on every fresh CI runner test:visual records new baselines and cannot fail. Details below. Fix: tests/e2e/visual.spec.ts fails when a baseline is missing, with instructions; baselines are recorded only with PS_UPDATE_BASELINES=1 and committed after review. The first CI run on Linux will therefore fail visual until linux-swiftshader baselines are recorded and committed, which is the intended behaviour. | With the darwin-gpu WebGL baseline removed the test failed with 'no visual baseline ... (D-008)'; with the committed baselines both visual tests pass (21/10/2026). |
| D-009 | 21/10/2026 | closed 21/10/2026 | Gate review: when the AS cannot keep up at 1x the HUD never shows "running below real time". The main thread caps the wall time it hands the worker at 0.1 s per round trip (src/app/main.ts MAX_FRAME_SECONDS and pendingSeconds) and drops the rest silently; the flag only comes from the 48-tick budget in FrameClock. Measured with stack-1000 at 1x: 15 and 37 ticks per second (12% and 31% of real time) with no badge. MASTER 2.8 requires the flag whenever time is dropped because the AS cannot keep up. Details below. Fix: src/app/realtime.ts compares simulated time advanced with wall time times the requested scale over a sliding window (at least 1 s and 30 ticks of requested time, hysteresis 0.90 to 0.97) and the HUD shows 'running below real time: <achieved> of <requested>' whatever the cause of lost time; the frame clock's own flag still shows the badge, without a rate until one has been measured. | tests/unit/realtime.test.ts (7 tests, including slow motion at 1/100x and a negative control) and tests/e2e/realtime.spec.ts: with each worker frame slowed to 150 ms at 1x the badge reads about 0.67x of 1x and clears when the delay is removed; with the monitor disabled the badge never appears and the test fails; cube-drop at 1x never shows it (21/10/2026). |
| D-010 | 21/10/2026 | closed 21/10/2026 | Gate review: when device-loss recovery cannot create a new renderer, SceneRenderer.recover() rejects unhandled and leaves the page with no canvas, `lost` stuck at true and no retry or message beyond the error overlay. Reproduced under SwiftShader on this Mac (the MASTER 13.3 flags in the headless shell): the device is lost at first present (ADR 0009), the first recovery succeeds, the second loss falls back to WebGL2, which also fails, and the page ends with 0 canvases and "TypeError: Cannot read properties of null (reading getSupportedExtensions)". The old canvas is removed before the new renderer exists. Details below. Fix: recover() keeps the old canvas until a new renderer exists, retries WebGPU at 0, 0.5 and 2 s, then WebGL2 (straight to WebGL2 after more than two losses in 10 s), never rejects, and reports total failure once through onRecoveryFailed (HUD note plus the error overlay) while the simulation keeps running. | tests/e2e/device-loss.spec.ts, three 'D-010' tests using the test hook crashGpu({ failRecoveries }): 2 failures then WebGPU, 3 failures then WebGL2 with the camera working, 10 failures reported once with one canvas left and the simulation stepping; 6 of 6 device-loss tests pass (21/10/2026). |

## Details of defects found in the P00 gate review (21/10/2026)

Environment for all browser steps: `npm run build:test` output (built as `VITE_TEST_API=1 npx vite build --outDir <scratch>/dist-review` so the running gate's dist-test was not disturbed), served by `npx vite preview --port 4191 --strictPort`, full Chromium (Playwright channel 'chromium', headless, `--enable-unsafe-webgpu --ignore-gpu-blocklist`, Apple M4 Max real GPU), viewport 1280 x 800. Machine load average was 60 to 360 throughout (other projects' jobs), so timings are not representative.

### D-002 Orbit camera dead after device-loss recovery

Steps: open http://localhost:4191/, await `window.__ps.ready`, wait 3 s. Scroll the wheel horizontally 10 times over the canvas, then drag 200 px: the view orbits (pixel signature of an 81-point readback grid changes by 3,095 and 1,942). Run `await window.__ps.crashGpu()` and wait for the HUD note "GPU device lost: recovered (Device was destroyed. (destroyed))". Repeat the wheel, the drag and a ctrl+wheel pinch.

Expected: the camera orbits and zooms as before the loss (MASTER 12 Recovery: device loss recovered without losing state).

Actual: the view does not change at all (signature difference 0 for wheel, drag and pinch). `document.querySelector('canvas')` is a new element; the old canvas is disconnected. Same code path for a real GPU-process crash (Browser.crashGpuProcess), since both go through SceneRenderer.recover().

Console: clean (no errors); the defect is silent.

### D-003 HUD hashes after R

Steps: open the game, press Space when the tick is not divisible by 60 (for example tick 242), press R.

Expected: the HUD lets a player see that the replay hash equals the original run's hash at the same tick.

Actual: paused at tick 242 the "hash" row reads 3ff208932f4aa94f (the golden hash for tick 240) and the replay line reads "replay matches: 0cd612e2cacb629a" (tick 242). While running, after R at about tick 1,480: "hash" d9ed879c0adae80d, replay line "replay matches: ef1be4db7551d361". The cube does not move when R is pressed (screenshots before and after R are identical apart from the HUD).

Console: clean.

### D-004 Lint bypasses in src/sim

Steps: with ESLint's Node API, `lintText(code, { filePath: '<repo>/src/sim/core/__probe__.ts' })` for each snippet: `const { sin } = Math; export const s = sin(1);`, `const M = Math; export const s = M.sin(1);`, `export const s = globalThis.Math.sin(1);`, `export const t = globalThis.Date.now();`, `export const t = globalThis.performance.now();`, `export const r = Reflect.get(Math, 'random')();`.

Expected: each reports a sim/* rule (MASTER 5.4).

Actual: no sim/* message for any of them. `Math.pow.call(null, 2, 3)` is caught. dependency-cruiser does block relative imports from src/sim into src/render and src/gpu (checked on a copy of src with a probe file), but no test proves those rules fire.

### D-005 Input for an unknown entity stops the simulation

Steps: `const s = await window.__ps.getState(); await window.__ps.applyInputs([{ type: 'impulse', tick: s.tick + 240, entity: 99, ix: 0, iy: 100, iz: 0 }]);` resolves without error. Wait 3 s.

Expected: the input is rejected when queued and the simulation keeps running.

Actual: HUD note "Simulation stopped after an error: see the error report."; the error overlay opens; the tick stops advancing.

Console: `console.error: [sim.frame] Error: input targets unknown entity 99 at Si.applyInput (sim-worker-idQf8ox4.js) at e.step at Object.runTicks at Object.frame`.

### D-007 Gate tool passes items without the required evidence

Steps: read tools/gate.ts lines 33 (G2b), 37 (G6), 45 (G14) and 46 (G15); run `node tools/gate.ts P00 review` and compare docs/phases/P00-review.md with programme/phases/P00-foundations.md "Gate".

Expected: an item the phase file states (Firefox through Playwright; Chrome and Safari on Ricky's Mac; CI green on main; hooks, subagents and skills work with evidence; interactive within 30 s under SwiftShader) is reported as fail or "needs waiver" until its evidence exists.

Actual: all four are "pass"; G15's "agents 5, skills 5" is printed whenever .claude/agents/gate-reviewer.md and .claude/skills/phase-gate/SKILL.md exist; reports/gate/P00-G2.log contains "Tests 6 passed (6)" with ANSI colour codes between the words, so the evidence pattern `Tests\s+\d+ passed` never matches.

### D-008 Visual test seeds its own baseline

Steps: delete or omit tests/visual/baselines/cube-drop-120-chromium-webgpu-<platform>-<adapter>.json (it does not exist for linux-swiftshader) and run `npx playwright test tests/e2e/visual.spec.ts`.

Expected: a missing baseline fails the test (or the run is marked as a baseline-recording run, not a pass).

Actual: the test writes the baseline, logs "wrote new visual baseline", and passes.

### D-009 No "running below real time" flag when the AS is too slow

Steps: open the game, `await window.__ps.pause(); await window.__ps.loadScene("stack-1000", 7); await window.__ps.play();` and read the HUD and `getState().tick` once a second for 10 s at time scale 1x.

Expected: whenever the simulation advances slower than real time, the HUD shows "running below real time" (MASTER 2.8, WP0.5 HUD stub), ideally with the achieved rate (MASTER 5.3).

Actual: 15, 37, 84, 161, 112, 140, 107, 139, 102 and 108 ticks per second (real time is 120) with "AS step" up to 603 ms per frame; the badge never appeared. The machine load average was about 60 to 120 at the time, which is the situation the badge exists for; the cause is in the code, not the load.

Console: clean.

### D-010 Failed device-loss recovery leaves no canvas

Steps: serve the test build, launch Playwright's default Chromium headless shell with `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader --ignore-gpu-blocklist` on macOS, open the game and wait 3 s.

Expected: either the game keeps drawing (WebGPU or WebGL2), or recovery fails visibly with a clear message and the last canvas stays in place; no unhandled rejection.

Actual: `__ps.ready` resolves after 429 ms with backend WebGPU; the device is then lost twice ("A valid external Instance reference no longer exists."), the HUD note says "GPU device lost: recovered", the second recovery falls back to WebGL2 and throws, `document.querySelectorAll("canvas").length` is 0 and the error overlay lists 7 errors.

Console: six `console.error: THREE.WebGPURenderer: Uncaptured WebGPU GPUValidationError: [Invalid Texture] is invalid due to a previous error ...` (and the matching CommandEncoder and Queue.Submit errors), warnings "Failed to create WebGPU Context Provider" and "THREE.WebGPURenderer: WebGPU is not available, running under WebGL2 backend.", then `pageerror: Cannot read properties of null (reading 'getSupportedExtensions')`.

This also shows that the "interactive within 30 s under SwiftShader" gate item cannot be measured on this Mac; it needs the Linux CI run.
