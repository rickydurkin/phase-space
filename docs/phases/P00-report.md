# P00 report - Foundations

Date 16/10/2026, programme version 1.0.0, physics version 0.1.0, game version 0.0.0, commit 552060c.

## Summary

14 of 18 gate items pass, 4 fail. The failing items are listed below with their evidence; the gate stays open.

## Gate table

| Item | Gate | Result | Evidence |
|---|---|---|---|
| G1 | Every command in MASTER 13.1 exists, is real and passes (verify:fast) | pass | verify:fast passed in 64.4 s (budget 90 s) |
| G2 | Golden replay identical across three Node runs, stubbed worker, 30/60/120/144 Hz and 0.01x/1x/100x; snapshot at tick 300 | pass | ; inert performance.now reads by Rapier's profiler: 78880 |
| G2b | Golden replay identical in Chromium, WebKit and Firefox through Playwright | fail | 4 passed (21.9s); engines: chromium matches, chromium:stack-1000 matches, webkit matches, webkit:stack-1000 matches; firefox not run on macOS (ADR 0009), CI covers it |
| G3 | Lint blocks Math.random, Date.now, Math.sin, Math.tanh, ** and non-allowlisted imports in src/sim (tests prove each rule fires) | pass | exit 0 |
| G4 | Every dmath function within 2 ulp over a million samples | pass | exp maxUlp=0.885; cbrt maxUlp=0.666; pow maxUlp=0.831; sinh maxUlp=1.701; sin maxUlp=0.830; cos maxUlp=0.815; log1p maxUlp=0.616; cosh maxUlp=1.255; atan maxUlp=1.391; expm1 maxUlp=0.785; hypot maxUlp=0.853; tan maxUlp=0.848; tanh maxUlp=1.348; log maxUlp=0.777; asin maxUlp=0.852; log10 maxUlp=0.584; acos maxUlp=0.888; atan2 maxUlp=1.432; log2 maxUlp=0.539 |
| G5 | Validation benches (M1) within tolerance with negative controls | pass | M1 expected=19.61330 measured=19.62324 error=0.0507%; |
| G6 | E2E: interactive within 30 s under SwiftShader, zero console errors, pixel readback shows the cube, device loss recovers with state intact | fail | boot 251 ms, backend WebGPU; cube found at y=72, colour {"r":75.03125,"g":38,"b":11}; 2 passed (8.1s) |
| G7 | The WebGL2 fallback boots and draws the cube | pass | 1 passed (2.9s) |
| G8 | GPU kernel against its CPU reference through Dawn; WGSL validation | pass | advect: 4096 particles, exact matches 12925/16384, max abs diff 2.384185791015625e-7; ok src/gpu/kernels/advect.wgsl |
| G9 | Fuzzing: random scenes deterministic, finite, snapshot round trip | fail | exit 1; see reports/gate/P00-G9.log |
| G10 | missions:verify wired (empty set) | pass | missions:verify: 0 mission files, 0 verified, 0 failed |
| G11 | Visual: reference-scene pixel readback and screenshots per adapter | pass | 2 passed (3.7s) |
| G12 | Soak (5-minute version): clean console, heap flat | pass | soak: random play for the configured minutes with a flat JS heap and a clean console (5.0m); 1 passed (5.1m) |
| G13 | Build and bundle size budget | fail | bundle gzip total 3.40 MB (budget 2.5), largest dist/assets/sim-worker-VNo-xCK_.js 1.59 MB (budget 1.6) |
| G14 | CI configured (ci.yml, nightly.yml, deploy.yml); deployment only after Ricky approves | pass | ci.yml present, nightly.yml present, deploy.yml present; CI not yet run (no remote) |
| G15 | Hooks, subagents and skills work, with evidence | pass | docs/phases/P00-hook-proof.md (PostToolUse blocked a type error and invalid WGSL with exit 2; Stop hook honours stop_hook_active); agents 5, skills 5 |
| G16 | Spike ADRs with measured numbers; tick decision recorded | pass | 0004-spike-s1-rapier: present; 0005-tick-rate: present; 0006-dmath: present; 0007-spike-s2-renderer: present; 0008-spike-s3-hud: present; 0009-spike-s4-test-stack: present |
| G17 | perf:mac baseline recorded in docs/BASELINE.md | pass | | cube-drop | Ultra (P00: single tier) | 8.30 | 8.70 | 9.30 | 120 | 0.00 | 0 | | stack-1000 | Ultra (P00: single tier) | 8.30 | 8.90 | 9.30 | 120 | 1.40 | 168 | |

## Benches

| id | expected | measured | error | pass |
|---|---|---|---|---|
| M1 free fall, 2 s drop (m) | 19.61330 | 19.62324 | 0.0507% (tolerance 0.5%) | pass |

## Missions

None in P00 (missions:verify wired with an empty set).

## Performance

| Scene | Tier | Frame p50 ms | p95 ms | p99 ms | fps | AS ms per frame | AS ms per simulated second |
|---|---|---|---|---|---|---|---|
| cube-drop | Ultra (P00: single tier) | 8.30 | 8.70 | 9.30 | 120 | 0.00 | 0 |
| stack-1000 | Ultra (P00: single tier) | 8.30 | 8.90 | 9.30 | 120 | 1.40 | 168 |

## Defects opened and closed; waivers requested

No defects recorded. No waivers requested.

## Gate-reviewer findings

Pending the gate-reviewer subagent run (docs/phases/P00-review.md).

## What changed in LEARNINGS and IDEAS

LEARNINGS: 13 entries. IDEAS: 3 entries.

## Playtest checklist for Ricky
 (10 minutes)

1. Open the deployed page in Chrome and in Safari on the Mac.
2. Watch the cube fall. Press R to replay. Check the HUD shows matching hashes.
3. Pinch to zoom and two-finger drag to orbit; say whether it feels right.
4. Read the summary at the top of docs/phases/P00-report.md and note anything unclear.

Total gate run time 34.6 minutes. Logs: reports/gate/.
