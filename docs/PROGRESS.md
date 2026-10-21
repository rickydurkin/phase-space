# PROGRESS

Phase: P00
Programme version: 1.0.0
Physics version: 0.1.0
Last updated: 16/10/2026 (end of session 1)

## Setup answers (P00 planning questions)

Ricky was not available during session 1, so these are working assumptions, each cheap to change (see Open questions).

1. Repository visibility and licence: not decided. The repository is local only (no GitHub remote) and has no LICENSE file. Nothing has been published.
2. Where Claude Code is running: on Ricky's Mac (Apple M4 Max, 128 GB, macOS 27.0.1, Chrome 155 and Safari installed). Real GPU available: perf:mac has run.
3. Working title: PHASE SPACE stays.

## Current state (end of session 2, 21/10/2026)

P00 is built and reviewed. The independent gate review (docs/phases/P00-review.md) recommended fail and filed D-002 to D-010; all nine are fixed with regression tests that failed before the fix. The final gate run on commit 7821872 (docs/phases/P00-report.md): 8 of 11 items pass, 0 fail, 3 blocked. 19 of 22 features in docs/features.json pass.

The three blocked items all need the first CI run on Linux, which needs Q1 and Q2:

- Item 2: Firefox through Playwright. The engine itself is evidenced: Chrome 155, Safari 27.0.1 and Firefox 157 on Ricky's Mac reproduce every golden hash (reports/engines-native.json), as do Playwright Chromium and WebKit.
- Item 6: interactive within 30 s under SwiftShader (SwiftShader loses the device on macOS, ADR 0009).
- Item 8: CI green on main.

Open defect: D-011 (cube-drop frame-interval p95 9.7 ms against 8.3 ms, measured at load average 31; needs GPU timestamps in P1 and an idle re-run).

## Next steps (in order)

1. Ricky answers Q1 to Q3; create the GitHub repository, push, and watch the first CI run. Expect it to fail test:visual until linux-swiftshader baselines are recorded with PS_UPDATE_BASELINES=1 and committed (D-008 working as intended).
2. Re-run `npm run gate P00`; items 2, 6 and 8 should then have their evidence. Ask the gate-reviewer subagent for a second review of the fixes.
3. Ricky's playtest (checklist at the end of the report), then "close P00" and tag v0.1.0.
4. P1 carries: InstancedMesh and the 10,000-body spike (ADR 0007), Preact signals HUD (ADR 0008), GPU timestamp queries (D-011), the plain Rapier deterministic build with a .wasm asset to free the worker chunk's size headroom (IDEAS), adaptive snapshot ring depth (ADR 0004), remove react and zustand from devDependencies.

## Open questions for Ricky

- Q1: public or private repository, and which licence? GitHub Pages needs a paid plan for private repositories.
- Q2: approve publishing (GitHub remote, Actions, Pages deployment)? Nothing is published until you say so; deploy.yml also waits for the DEPLOY_APPROVED variable.
- Q3: does the working title PHASE SPACE stay?
- Q4: ADR 0008 chooses Preact signals over the MASTER default of React with Zustand on measured cost; confirm or overrule.
- Q5: R now replays the run visibly from the start before comparing hashes (D-003). The reviewer left this to you; say if you would rather R check silently.

## Session log

### Session 2, 20/10/2026 to 21/10/2026 (Opus 5.5)

- Shown the build in the browser pane; the Stop hook blocked once on a load-induced timeout (another project's jobs), cleared on rerun.
- Fixed D-001 (unhandled popErrorScope rejection after a GPU crash).
- Independent gate review (gate-reviewer subagent): fail, D-002 to D-010 filed.
- Fixed D-002 camera after recovery, D-003 visible replay and hash-at-tick, D-004 lint bypasses, D-005 input validation, D-006 soak to the 5% rule with GPU counts, D-007 gate tool rewritten, D-008 visual baselines, D-009 real-time monitor, D-010 recovery retries and WebGL2 fallback. Each has a regression test shown to fail without its fix.
- New: tools/engine-check.ts (golden replay in the Mac's own Chrome, Safari and Firefox: all match), live evidence for hooks, scoped rules, subagent and skill (P00-hook-proof.md), perf:mac averaging and budget flags, D-011 filed.

### Session 1, 15/10/2026 to 16/10/2026

- Bootstrap: repository initialised, programme/ copied in, package.json, PROGRESS.md and P00-plan.md (commit 7c9b1d2).
- Toolchain: TypeScript 6.0.3 (three tsconfigs; src/sim without DOM), ESLint 10 with tools/eslint/plugin-sim.js, dependency-cruiser, Vitest 5 projects, Playwright 1.64.1, Dawn (webgpu 0.6.2), content lint, count check, verify:fast under 90 s (ADR 0001).
- Core: dmath (fdlibm and FreeBSD ports, 19 functions; million-sample run 18 of 19 within 2 ulp, tanh fixed with musl's range split and re-run), keyed RNG, FNV-1a 64, world registry with stable ids (ADR 0002), scheduler and input log, binary snapshots, replay runner, energy ledger with negative controls, frame clock, Rapier mechanics domain.
- Tests: unit (hash, rng, world, ledger, clock, dmath, lint rules), bench M1 (0.0507% error), golden cube-drop (Node x3, stubbed worker, 30/60/120/144 Hz x 0.01/1/100x, snapshot at 300), fuzz (60 scenes), GPU kernel via Dawn under node:test (ADR 0003), e2e (golden in Chromium and WebKit, smoke, WebGL2, device loss by test API and CDP, visual baselines, 5-minute soak).
- Presentation (subagent): Vite app, WebGPURenderer with WebGL2 fallback, AS worker with transferable frames and interpolation, orbit camera for trackpads, HUD, error overlay, replay page, window.__ps test API.
- Spikes S1 to S6 measured (ADRs 0004 to 0009); perf:mac baseline written (docs/BASELINE.md).
- CI workflows, Claude Code setup (CLAUDE.md, rules, hooks with proof, agents, skills, .mcp.json), docs (SCHEDULE.md, model card, PHYSICS-CHANGELOG, DEFECTS, LEARNINGS, IDEAS, research refresh).
- First full gate run found four defects in the harness and fixed them (fuzz floor-edge invariant with a frozen seed, Rapier bundled twice, CI variable handling, D-001); final gate 18 of 18.
- Lessons of the session are in docs/LEARNINGS.md (14 entries).
