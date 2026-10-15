# PHASE SPACE

Deterministic 3D multi-physics sandbox for the browser. The full programme is in programme/ (read-only for you): read programme/MASTER.md Part A every session. Working documents live in docs/. Phase: see docs/PROGRESS.md.

## Commands

- `npm run verify:fast` typecheck (3 configs), ESLint, content lint, dependency-cruiser, unit tests, golden smoke, count check. Under 90 s. Runs in the Stop hook.
- `npm run test:validation` physics benches (tests/validation, parameters frozen in benches.json).
- `npm run test:dmath:full` million-sample dmath accuracy (minutes; gates and nightly).
- `npm run test:golden` golden replays in Node and in Chromium, WebKit and Firefox.
- `npm run test:fuzz` fast-check scene fuzzing (FUZZ_RUNS to lengthen).
- `npm run test:gpu` WGSL kernels against CPU references through Dawn (node:test), then WGSL validation.
- `npm run missions:verify` mission pipeline (empty in P0).
- `npm run test:e2e`, `test:e2e:smoke`, `test:visual`, `test:soak` Playwright (SwiftShader flags in playwright.config.ts).
- `npm run perf:mac` real-GPU performance on Ricky's Mac; writes docs/BASELINE.md.
- `npm run gate P00` phase gate report; `npm run gate P00 review` for reviewers.
- `npm run dev`, `npm run build`, `npm run build:test` (window.__ps test API), `npm run preview` (port 4181).
- `node tools/golden.ts --write <scene>` regenerate a golden file (only with a physicsVersion bump).

## Rules digest (MASTER section 2; the file is the authority)

- Deterministic authoritative simulation in src/sim: CPU only, fixed tick, seeded streams keyed by cause, dmath instead of Math transcendentals, no wall clock, stable id order. Lint and tests enforce it (.claude/rules/sim.md).
- GPU is for detail only; nothing from src/gpu feeds back into AS state.
- SI units, one constants module (src/sim/core/constants.ts), every number sourced or flagged est.
- Tests are sacred: never delete, weaken, skip or loosen a test, tolerance, bench, golden file or gate. docs/features.json: only `passes` and `evidence` change, entries append.
- Evidence before claims: command, output, hash, screenshot.
- Zero console errors in every automated run. No runtime CDN imports. Pin exact versions.
- en-GB, DD/MM/YYYY, plain hyphens, straight quotes, no emoji (tools/content-lint.ts).
- Small reversible steps; commit after each verified step; main stays green; wip/ branches for red work.
- Stop and ask Ricky for anything that publishes, costs money, needs an account, or changes a gate.

## File map

- src/sim/ Authoritative Simulation: core/ (world, simulation, clock, ledger, hash, bytes, replay, types), dmath/ (fdlibm ports), rng/, scenes/, domains/mechanics/ (Rapier adapter), version.ts (PHYSICS_VERSION).
- src/gpu/ WGSL kernels and CPU references. src/render/ three.js WebGPURenderer, camera. src/ui/ HUD, error overlay. src/app/ main thread bootstrap, sim worker, replay page, test API. src/content/schemas/ zod schemas.
- tests/ unit, validation (benches.json, dmath-full), golden (harness with throwing stubs), fuzz, gpu, e2e (Playwright), helpers. tests/counts.json is the floor for test counts.
- tools/ verify-fast, golden, gate, perf-mac, content-lint, check-counts, missions-verify, wgsl-validate, size-check, hooks/, spikes/, eslint/plugin-sim.js.
- docs/ PROGRESS.md (read first), features.json, DEFECTS.md, LEARNINGS.md, IDEAS.md, PHYSICS-CHANGELOG.md, BASELINE.md, adr/, model-cards/, research/, phases/, playtests/, architecture/SCHEDULE.md.
- .claude/ rules (sim, gpu, content), agents (physics-auditor, mission-critic, qa-player, perf-auditor, gate-reviewer), skills (run-game, new-mission, new-bench, model-card, phase-gate), settings.json (hooks).

## Gotchas

- src/sim is typechecked with tsconfig.sim.json (no DOM lib) and loaded by Node's type stripping in the golden worker: erasable syntax only (no enums, no parameter properties, `import type`), `.ts` extensions on relative imports.
- Rapier handles are doubles with meaningful bit patterns; never do arithmetic on them. Rapier reads performance.now for its profiler only; the golden harness answers that caller with 0.
- Decimal references for dmath must be built from the double's bits (tests/helpers/dmath-ref.ts exact()); large trig arguments need precision beyond 40 digits.
- GPU tests use node:test, not Vitest (Dawn segfaults in Vitest's forked worker, ADR 0003); a Dawn process must destroy its device before exit.
- Golden hash changes mean a physics change: bump PHYSICS_VERSION, write docs/PHYSICS-CHANGELOG.md, regenerate.
- The content lint scans docs/ and content/ for long dashes, curly quotes, ellipsis characters, emoji and US spellings; `lint-allow` on a line skips it.
