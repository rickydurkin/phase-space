# P00 report - Foundations

Date 24/10/2026, programme version 1.0.0, physics version 0.1.0, game version 0.0.0, commit f57b4a4.
Machine: darwin arm64, 16 cores; load average 6.0 at the start and 8.2 at the end; run time 19.4 minutes.

## Summary

8 of 11 gate items pass, 0 fail, 3 blocked, 0 not run. Blocked items need evidence this machine cannot produce (CI on Linux, or Ricky); they are not passes and closing the gate without them needs Ricky's written waiver.

## Gate table

| # | Gate item (from the phase file) | Result | Evidence |
|---|---|---|---|
| 1 | Every command in MASTER 13.1 exists, is real (no bootstrap stubs left) and passes. | pass | verify:fast: verify:fast passed in 24.4 s (budget 90 s)<br>test:validation: 2 of 2 passed; M1 expected=19.61330 measured=19.62324 error=0.0507%<br>test:golden (Node): 6 of 6 passed<br>test:fuzz: 2 of 2 passed<br>test:gpu: advect: 4096 particles, exact matches 12925/16384, max abs diff 2.384185791015625e-7; ok src/gpu/kernels/advect.wgsl<br>missions:verify: missions:verify: 0 mission files, 0 verified, 0 failed<br>test:e2e (all Playwright specs): 20 of 20 passed<br>  smoke.spec: 1 of 1 passed<br>  device-loss.spec: 6 of 6 passed<br>  webgl.spec: 1 of 1 passed<br>  visual.spec: 2 of 2 passed<br>  replay.spec: 2 of 2 passed<br>  realtime.spec: 3 of 3 passed<br>  golden.spec: 4 of 4 passed<br>  soak.spec: 1 of 1 passed<br>build and size: bundle gzip total 1.83 MB (budget 2.5), largest dist/assets/sim-worker-BOFJq4rk.js 1.60 MB (budget 1.6)<br>perf:mac: not run by the gate (needs headed Chrome on Ricky's Mac); docs/BASELINE.md written 21/10/2026 |
| 2 | The cube-drop golden replay gives identical hashes across three Node runs, in Chromium, WebKit and Firefox through Playwright, and in Chrome and Safari on Ricky's Mac, with frame pacing simulated at 30, 60, 120 and 144 Hz and time scales of 0.01x, 1x and 100x. | blocked | Node, three runs: passed; stubbed worker: passed; 30/60/120/144 Hz x 0.01/1/100x: passed<br>Playwright Chromium: 2 of 2 passed<br>Playwright WebKit: 2 of 2 passed<br>Playwright Firefox: not run<br>Playwright Firefox from CI: CI run 40042647008 on f57b4a4: still running<br>chrome on this Mac: matches 3374e5261804bf27 (21/10/2026)<br>safari on this Mac: matches 3374e5261804bf27 (21/10/2026)<br>firefox on this Mac: matches 3374e5261804bf27 (21/10/2026) |
| 3 | Snapshot at tick 300, restore, run 600 ticks: the hash equals the uninterrupted run. | pass | tests/golden/node.test.ts "snapshot at tick 300, restore, run on": passed |
| 4 | Lint blocks Math.random, Date.now, Math.sin, Math.tanh, the ** operator and a non-allowlisted import in src/sim (a test proves each rule fires), and the throwing stubs are active in golden runs. | pass | tests/unit/lint-rules.test.ts and depcruise-rules.test.ts: 30 of 30 passed<br>throwing stubs active in the golden worker: passed |
| 5 | Every dmath function has a maximum error of at most 2 ulp against the references over a million samples. | pass | 19 of 19 functions measured; 19 within 2 ulp; worst sinh 1.701 ulp<br>exp 0.885, cbrt 0.666, pow 0.831, sinh 1.701, sin 0.83, cos 0.815, log1p 0.616, atan 1.391, expm1 0.785, cosh 1.255, hypot 0.853, tan 0.848, tanh 1.348, log 0.777, asin 0.852, log10 0.584, acos 0.888, log2 0.539, atan2 1.432 |
| 6 | E2E: interactive within 30 s under SwiftShader; zero console errors; pixel readback shows the cube; device loss recovers with the state intact. | blocked | smoke (boot, pixel readback, zero console errors): 1 of 1 passed; boot 223 ms on WebGPU<br>device loss (state intact, D-001, D-002, D-010): 6 of 6 passed<br>adapter: the real GPU; SwiftShader loses the device at first present on macOS (ADR 0009), so the 30 s SwiftShader boot is measured in CI on Linux<br>SwiftShader from CI: CI run 40042647008 on f57b4a4: still running |
| 7 | The WebGL2 fallback boots and draws the cube. | pass | tests/e2e/webgl.spec.ts: 1 of 1 passed |
| 8 | CI is green on main; deployment works if Ricky approved it. | blocked | remote: origin<br>CI run 40042647008 on main for f57b4a4: still running (2026-10-23T23:59:16Z)<br>deployment: only once Ricky approves publishing (DEPLOY_APPROVED) |
| 9 | Hooks, subagents and skills work, with evidence in the report. | pass | docs/phases/P00-hook-proof.md: 5 of 5 live-evidence sections<br>on disk: 5 subagents in .claude/agents, 5 skills in .claude/skills |
| 10 | Spike ADRs exist with measured numbers, and the tick decision is recorded. | pass | S1 docs/adr/0004-spike-s1-rapier.md: 16 measured values<br>S2 docs/adr/0007-spike-s2-renderer.md: 10 measured values, partial (see the ADR)<br>S3 docs/adr/0008-spike-s3-hud.md: 11 measured values<br>S4 docs/adr/0009-spike-s4-test-stack.md: 3 measured values<br>S5 docs/adr/0006-dmath.md: 8 measured values<br>S6 docs/adr/0005-tick-rate.md: 18 measured values, partial (see the ADR)<br>tick decision recorded: yes, 1/120 s with two substeps (ADR 0005) |
| 11 | perf:mac baseline recorded in docs/BASELINE.md (Ricky runs it if you are in the cloud). | pass | 2 scenes recorded (21/10/2026)<br>over budget: cube-drop (recorded, not hidden) |

## Benches

| id | expected | measured | error | pass |
|---|---|---|---|---|
| M1 free fall, drop in 2 s (m) | 19.61330 | 19.62324 | 0.0507% (tolerance 0.5%) | pass |

## Missions

None in P00 (missions:verify is wired with an empty set).

## Performance

| Scene | Tier | Frame p50 ms | p95 ms | p99 ms | fps | AS ms per frame | AS ms per simulated second | Budget |
|---|---|---|---|---|---|---|---|---|
| cube-drop | Ultra (P00: single tier) | 8.30 | 9.70 | 10.40 | 121 | 0.19 | 23 | over budget: frame p95 over 8.3 ms |
| stack-1000 | Ultra (P00: single tier) | 8.30 | 9.00 | 10.20 | 120 | 1.05 | 126 | within budget |

## Defects

| id | status | summary |
|---|---|---|
| D-001 | closed 20/10/2026 | When the GPU process is killed (Browser.crashGpuProcess), three.js WebGPURenderer's pending popErrorScope promise rejects with "OperationError: Instance dropped |
| D-002 | closed 21/10/2026 | Gate review: after WebGPU device-loss recovery the orbit camera no longer responds to drag, two-finger scroll or pinch |
| D-003 | closed 21/10/2026 | Gate review: after pressing R the HUD shows two different hashes |
| D-004 | closed 21/10/2026 | Gate review: the src/sim determinism lint rules can be bypassed |
| D-005 | closed 21/10/2026 | Gate review: Simulation.queueInput accepts an input for an entity that does not exist; when its tick arrives applyInput throws inside step(), the game stops ("S |
| D-006 | closed 21/10/2026 | Gate review: the soak heap check is looser than MASTER 12 (heap flat within 5%) |
| D-007 | closed 21/10/2026 | Gate review: tools/gate.ts reports gate items as pass without the evidence the P00 gate requires |
| D-008 | closed 21/10/2026 | Gate review: tests/e2e/visual.spec.ts writes a missing baseline and passes |
| D-009 | closed 21/10/2026 | Gate review: when the AS cannot keep up at 1x the HUD never shows "running below real time" |
| D-010 | closed 21/10/2026 | Gate review: when device-loss recovery cannot create a new renderer, SceneRenderer.recover() rejects unhandled and leaves the page with no canvas, `lost` stuck  |
| D-011 | open | perf:mac on 21/10/2026: cube-drop frame-interval p95 9.7 ms against the 8.3 ms Ultra budget for reference scenes (MASTER 12), p50 8.3 ms, measured at load avera |
| D-012 | closed 23/10/2026 | First CI run (GitHub Actions, Linux, SwiftShader): the main loop handed the worker at most 0.1 s of wall time per round trip, so whenever rendering ran below 10 |
| D-013 | closed 23/10/2026 | Third CI run (GitHub Actions run 40028684366, Linux, SwiftShader): two e2e tests failed on test-side faults |
| D-014 | closed 24/10/2026 | CI run 40032370739 (5d42e6f): 'D-010: recovery retries after failed attempts and keeps exactly one canvas' timed out waiting for the cube although recovery had  |
| D-015 | open | CI run 40037733859 (bd50397, Linux, SwiftShader): Chrome logged 'GL_INVALID_OPERATION: glBlitFramebuffer: Blit feedback loop: the read and draw framebuffers are |

## Gate-reviewer findings

See the latest docs/phases/P00-review.md and the defects above.

## Playtest checklist for Ricky
 (10 minutes)

1. Open the deployed page in Chrome and in Safari on the Mac.
2. Watch the cube fall. Press R to replay. Check the HUD shows matching hashes.
3. Pinch to zoom and two-finger drag to orbit; say whether it feels right.
4. Read the summary at the top of docs/phases/P00-report.md and note anything unclear.

Until Ricky approves GitHub Pages (Q2b in docs/PROGRESS.md) there is no deployed page: play the local build instead (`npm run dev`, then the printed address in Chrome and in Safari).

Logs and structured results: reports/gate/ and reports/playwright.json.
