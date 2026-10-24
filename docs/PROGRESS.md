# PROGRESS

Phase: P00
Programme version: 1.0.0
Physics version: 0.1.0
Last updated: 24/10/2026 (session 3)

## Setup answers (P00 planning questions)

Answered by Ricky on 21/10/2026:

1. Repository visibility and licence: public, MIT (LICENSE). Approved by Ricky on 21/10/2026.
2. Publishing: create the public GitHub repository, push and run CI. Approved by Ricky on 21/10/2026. GitHub Pages deployment is not approved yet; deploy.yml stays idle until the repository variable DEPLOY_APPROVED is "true".
3. Working title: PHASE SPACE stays.

Claude Code runs on Ricky's Mac (Apple M4 Max, 128 GB, macOS 27.0.1, Chrome, Safari and Firefox installed).

## Current state (session 3, 24/10/2026)

The public repository is https://github.com/rickydurkin/phase-space (MIT), with the history on Ricky's GitHub no-reply address. CI is green on main: run 40034825786 on commit 1db8418 passed every job, including all 21 Playwright tests on Linux with SwiftShader (Firefox, Chromium and WebKit golden replays, a 415 ms SwiftShader boot, device loss, WebGL2, visual baselines). GitHub Pages is not deployed: deploy.yml skips itself until the repository variable DEPLOY_APPROVED is "true".

CI is not reliably green yet: D-015 (open) is a GL error that Chrome on CI's SwiftShader logs intermittently while the game renders through WebGL2, which fails the clean-console check of the WebGL2 fallback test in roughly one CI run in five (run 40037733859 on bd50397). Diagnosis is on branch wip/blit-probe; the error does not come from the game's own GL calls, and one fix hypothesis has been ruled out. See Q6.

Getting CI green took three defects, all fixed with evidence: D-012 (the main loop's 0.1 s frame cap threw simulated time away below 10 fps), D-013 (a cube scan too slow for a software rasteriser, and a badge test that sampled during start-up) and D-014 (two device-loss tests whose scene depended on timing). The gate tool now reads the Firefox and SwiftShader evidence from the CI run of the commit being gated.

The full gate (`npm run gate P00`) passed 11 of 11 items on 1db8418 (CI run 40034825786 green). The latest run, on f57b4a4 (docs/phases/P00-report.md), has 8 pass, 0 fail and 3 blocked: items 2, 6 and 8 read CI for that exact commit, and its run 40042647008 was still installing runner packages when the gate finished. Re-run the gate once a CI run on main is green. 22 of 22 features in docs/features.json pass.

Open defects: D-015 (above) and D-011 (cube-drop frame-interval p95 9.7 ms against 8.3 ms, measured at load average 31; needs GPU timestamps in P1 and an idle re-run).

## Next steps (in order)

1. Ricky answers Q6 (D-015); CI on main is then made reliably green.
2. Ricky's playtest (checklist at the end of docs/phases/P00-report.md). With Pages not approved, play the local build: `npm run dev` and open the printed address in Chrome and in Safari.
3. Optional: ask the gate-reviewer subagent for a second review of the fixes since the first review (D-011 to D-014 and the CI evidence path in tools/gate.ts).
4. Ricky writes "close P00"; tag v0.1.0.
5. P1 carries: InstancedMesh and the 10,000-body spike (ADR 0007), Preact signals HUD (ADR 0008), GPU timestamp queries (D-011), the plain Rapier deterministic build with a .wasm asset to free the worker chunk's size headroom (IDEAS), adaptive snapshot ring depth (ADR 0004), remove react and zustand from devDependencies.

## Open questions for Ricky

- Q2b: approve GitHub Pages deployment (set the repository variable DEPLOY_APPROVED to true)? Not yet approved.
- Q4: ADR 0008 chooses Preact signals over the MASTER default of React with Zustand on measured cost; confirm or overrule.
- Q6: D-015. Chrome on CI's SwiftShader intermittently logs "Blit feedback loop" for WebGL2 rendering, from below the game's own GL calls. Allow that one warning in SwiftShader CI runs (a documented allowlist entry, which loosens the clean-console check there), or keep investigating first?
- Q5: R now replays the run visibly from the start before comparing hashes (D-003). The reviewer left this to you; say if you would rather R check silently.

## Session log

### Session 3, 23/10/2026 to 24/10/2026 (Opus 5.5)

- Ricky answered the setup questions: public repository, MIT licence, title PHASE SPACE, no Pages yet.
- Installed the GitHub CLI (official zip, checksum verified) because Homebrew needs the Xcode licence; Ricky signed in through the device flow and approved the workflow scope.
- Rewrote the history to the no-reply address (a backup bundle of the old history was kept outside the repository), created rickydurkin/phase-space, pushed, and ran CI.
- The CI runs found D-012, D-013 and D-014 and the missing Linux visual baselines, which were recorded by the manual workflow and committed after review. Run 40030276231 was the first green one, run 40032370739 then failed on D-014, run 40034825786 is green, and run 40037733859 failed on D-015, which three probe runs on wip/blit-probe then characterised.
- tools/gate.ts reads Firefox and SwiftShader evidence from CI for the gated commit; full gate 11 of 11.

### Session 2, 20/10/2026 to 21/10/2026 (Opus 5.5)

- Shown the build in the browser pane; the Stop hook blocked once on a load-induced timeout (another project's jobs), cleared on rerun.
- Fixed D-001 (unhandled popErrorScope rejection after a GPU crash).
- Independent gate review (gate-reviewer subagent): fail, D-002 to D-010 filed.
- Fixed D-002 camera after recovery, D-003 visible replay and hash-at-tick, D-004 lint bypasses, D-005 input validation, D-006 soak to the 5% rule with GPU counts, D-007 gate tool rewritten, D-008 visual baselines, D-009 real-time monitor, D-010 recovery retries and WebGL2 fallback. Each has a regression test shown to fail without its fix.
- New: tools/engine-check.ts (golden replay in the Mac's own Chrome, Safari and Firefox: all match), live evidence for hooks, scoped rules, subagent and skill (P00-hook-proof.md), perf:mac averaging and budget flags, D-011 filed.

### Session 1, 15/10/2026 to 16/10/2026

- Bootstrap: repository initialised, programme/ copied in, package.json, PROGRESS.md and P00-plan.md (commit 75fab53).
- Toolchain: TypeScript 6.0.3 (three tsconfigs; src/sim without DOM), ESLint 10 with tools/eslint/plugin-sim.js, dependency-cruiser, Vitest 5 projects, Playwright 1.64.1, Dawn (webgpu 0.6.2), content lint, count check, verify:fast under 90 s (ADR 0001).
- Core: dmath (fdlibm and FreeBSD ports, 19 functions; million-sample run 18 of 19 within 2 ulp, tanh fixed with musl's range split and re-run), keyed RNG, FNV-1a 64, world registry with stable ids (ADR 0002), scheduler and input log, binary snapshots, replay runner, energy ledger with negative controls, frame clock, Rapier mechanics domain.
- Tests: unit (hash, rng, world, ledger, clock, dmath, lint rules), bench M1 (0.0507% error), golden cube-drop (Node x3, stubbed worker, 30/60/120/144 Hz x 0.01/1/100x, snapshot at 300), fuzz (60 scenes), GPU kernel via Dawn under node:test (ADR 0003), e2e (golden in Chromium and WebKit, smoke, WebGL2, device loss by test API and CDP, visual baselines, 5-minute soak).
- Presentation (subagent): Vite app, WebGPURenderer with WebGL2 fallback, AS worker with transferable frames and interpolation, orbit camera for trackpads, HUD, error overlay, replay page, window.__ps test API.
- Spikes S1 to S6 measured (ADRs 0004 to 0009); perf:mac baseline written (docs/BASELINE.md).
- CI workflows, Claude Code setup (CLAUDE.md, rules, hooks with proof, agents, skills, .mcp.json), docs (SCHEDULE.md, model card, PHYSICS-CHANGELOG, DEFECTS, LEARNINGS, IDEAS, research refresh).
- First full gate run found four defects in the harness and fixed them (fuzz floor-edge invariant with a frozen seed, Rapier bundled twice, CI variable handling, D-001); final gate 18 of 18.
- Lessons of the session are in docs/LEARNINGS.md (14 entries).
