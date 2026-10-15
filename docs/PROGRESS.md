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

## Current state (session 1)

P00 is built end to end; 20 of 22 features in docs/features.json pass with evidence (P00-011 Firefox and P00-019 CI wait for the first CI run). `npm run gate P00` passes 18 of 18 automated items (commit 5b634ab, 16/10/2026) with the caveats listed in the report. The deterministic core, Rapier mechanics, dmath, the golden harness, the browser app (WebGPU with WebGL2 fallback, worker, HUD, replay) and every command in MASTER 13.1 exist and run. The gate report is docs/phases/P00-report.md.

Known gaps, all recorded in the report:

- Firefox: Playwright's Firefox build does not start on this macOS (ADR 0009). Chromium and WebKit reproduce the golden hashes exactly. SpiderMonkey evidence needs the first CI run (Linux).
- SwiftShader: on macOS every SwiftShader WebGPU configuration loses the device at the first canvas present, so the local e2e runs on the real GPU; the 30 s SwiftShader boot budget is a CI measurement (ADR 0009).
- CI has never run (no remote). Workflows are written: ci.yml, nightly.yml, deploy.yml (deploy only when the repository variable DEPLOY_APPROVED is "true").
- Claude Code hooks, rules, agents and skills are written and the hooks are proven by direct invocation (docs/phases/P00-hook-proof.md); their behaviour inside a live CLI session is not yet observed (no `claude` on PATH in session 1).
- Spike S2 measured 1,000 meshes, not 10,000 instanced bodies (ADR 0007); instancing and post-processing are P1 work.

## Next steps (in order)

1. Ricky answers the open questions below; create the GitHub repository, push, watch the first CI run (Firefox golden, SwiftShader e2e on Linux), fix anything it finds.
2. Run `npm run gate P00` after the CI run, ask the gate-reviewer subagent to refute the report (`npm run gate P00 review`), then Ricky's playtest (checklist at the end of the report).
3. On "close P00": tag v0.1.0 (MASTER 3.4), then seed docs/features.json with P01 entries in P1's first session and run the P1 research refresh.
4. P1 carries: InstancedMesh batching and the 10,000-body spike (ADR 0007), Preact signals HUD (ADR 0008), GPU timestamp queries for real frame cost, adaptive snapshot ring depth (ADR 0004), remove react and zustand from devDependencies (ADR 0008).

## Open questions for Ricky

- Q1: public or private repository, and which licence? GitHub Pages needs a paid plan for private repositories.
- Q2: approve publishing (GitHub remote, Actions, Pages deployment)? Nothing is published until you say so; deploy.yml also waits for the DEPLOY_APPROVED variable.
- Q3: does the working title PHASE SPACE stay?
- Q4: ADR 0008 chooses Preact signals over the MASTER default of React with Zustand on measured cost; confirm or overrule.

## Session log

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
