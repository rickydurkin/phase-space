# P00 - Foundations

Programme v1.0.0. Prerequisite: none (this is session one). Typical length: 2 to 4 sessions.

## Goal

Set up the repository, toolchain, deterministic core and verification machinery so every later phase builds on proven ground. The end state is deliberately small and completely real: a cube falls onto a floor in WebGPU, the run replays bit for bit in Node and in Chromium, CI is green, and Ricky can open the deployed page on his Mac.

Mach Cone's Phase 1 was spent retrofitting trust into 67,000 lines of code. Building trust first, while the code is tiny, is the cheapest it will ever be.

## What Ricky can do at the end

Open the game in Chrome and Safari on his Mac, watch the cube fall and settle, press R to replay it, and see the HUD confirm that the replay hash matches the original run.

## Read first

- MASTER.md Part A in full, then sections 5, 11, 12, 13 and 14.
- programme/reference/LEARNINGS.md, sections 3 (process) and 4 (failure modes).
- programme/reference/RESEARCH-SNAPSHOT-2026-10-14.md, sections 1, 2, 4, 10 and 11.

## Plan (first session)

Ask Ricky three questions before creating anything public, then write docs/phases/P00-plan.md:

1. Repository visibility (public or private) and licence. A private repository needs a paid GitHub plan for GitHub Pages; the alternative is a public repository, or deploying from a private repository to Cloudflare Pages.
2. Where Claude Code is running: on his Mac (real GPU available for perf:mac and `claude --chrome`) or in the cloud (SwiftShader only; Ricky runs perf:mac himself).
3. Whether the working title PHASE SPACE stays.

## Work packages

### WP0.0 Bootstrap (first session, before anything else)

So that session two does not start Phase 0 again: as soon as Ricky has answered the three questions, write docs/PROGRESS.md with his answers and "Phase: P00", create package.json with `verify:fast` and `test:e2e:smoke` scripts that print NOT YET IMPLEMENTED and exit 0, and commit. The gate requires both to be real by the end of the phase.

### WP0.1 Research refresh

Verify every version in MASTER section 11 and the watch list with `npm view <pkg> version time --json` and GitHub release pages. Check WebGPU status in Chrome, Safari and Firefox. Check the installed Claude Code version against MASTER 13.5: confirm that hooks (including stop_hook_active in the Stop hook input), .claude/rules with paths frontmatter, skills, subagents and /goal behave as described, and record any fallback you need in an ADR. Write docs/research/YYYY-MM-DD-refresh.md with sources. Raise an ADR for any deviation from the defaults.

### WP0.2 Spikes

Each spike is time-boxed to half a session and ends in an ADR with measured numbers.

- S1 Rapier determinism in a worker: 1,000 bodies stepping at 120 Hz with two substeps; step cost; snapshot size and save and restore time; restore then 600 ticks gives an identical hash; Node, Chromium, WebKit and Firefox give identical hashes. Research measured 4.4 ms per step for 1,000 awake cubes with the deterministic build on a 2.1 GHz Xeon, and 3.3 KB of snapshot per body, so plan for input logs plus sparse checkpoints rather than snapshots every frame.
- S2 Renderer: three.js r186 WebGPURenderer drawing 10,000 instanced bodies through the post-processing pipeline, measured on Ricky's Mac (perf:mac) and under SwiftShader; the WebGL2 fallback (forceWebGL) boots and draws the same scene.
- S3 HUD cost: React 19 with Zustand against Preact signals, updating 200 readouts at 20 Hz; measure main-thread cost per frame. Choose by the numbers.
- S4 Test stack: Playwright with SwiftShader WebGPU pixel readback and a screenshot; a Dawn-in-Node compute kernel against its CPU reference; device loss through Browser.crashGpuProcess; a WGSL validator script built on createShaderModule and getCompilationInfo.
- S5 Deterministic maths: every dmath function (sin, cos, tan, asin, acos, atan, atan2, sinh, cosh, tanh, exp, expm1, log, log1p, log2, log10, pow, cbrt, hypot) against high-precision references over a million samples each, and their cost against Math.
- S6 Tick and budget: the AS loop with mechanics only at 120, 240, 480 and 960 Hz, in CI and on Ricky's Mac. Record the default tick, and the body counts that 480 and 960 Hz slow-motion study scenes can afford.

### WP0.3 Repository scaffold

- Structure from MASTER section 14. package.json with exact versions. tsconfig strict. Node version pinned in .nvmrc and package.json engines.
- ESLint (or Biome) plus dependency-cruiser rules (MASTER 5.4): src/sim may not import DOM, three.js, src/gpu or any package outside the allowlist (Rapier deterministic, bitECS); inside src/sim only the allowlisted Math functions are permitted (Math constants such as Math.PI are fine), the ** operator is an error, and Math.random, Date and performance.now are errors. Add a test that proves each rule fires.
- A Node harness for golden runs that executes the AS inside a worker_threads worker whose globals are stubbed so Math.random, Date, performance.now and every non-allowlisted Math function throw (stubbing the whole test process would break Vitest).
- A banned-characters and en-GB lint for content/ and player-facing strings (long dashes, curly quotes, emoji, US spellings from a word list).
- .editorconfig, formatter, licence as Ricky chose.

### WP0.4 Deterministic core

- src/sim/dmath, src/sim/rng (streams keyed by cause), units (branded types for seconds, metres, kilograms, kelvin and so on), constants (CODATA 2022 values with sources).
- Scheduler: fixed tick, documented order, ticks per frame from the time scale, the drop-not-stretch budget with an achieved-rate signal, deterministic event chunking.
- World: bitECS entity registry and components; stable IDs and ordering.
- Snapshot and restore, input log, replay format with a Zod schema, FNV-1a 64 state hash, event bus, observation bus, energy ledger skeleton, the DomainModule interface (MASTER 5.9).
- Mechanics domain, minimal: Rapier adapter with bodies, colliders and gravity; ledger reports kinetic and gravitational energy.

### WP0.5 Presentation skeleton

- Vite app; WebGPURenderer with automatic WebGL2 fallback; a tier-detection stub.
- AS in a worker sending transferable frames; interpolation on the main thread.
- A floor and a cube with a decent material and light, so the first impression is already good.
- Basic orbit camera with trackpad pinch and two-finger orbit.
- HUD stub: fps, AS step time, tick, current hash, "running below real time" flag.
- Error overlay that catches, reports and offers a copyable report; it never silently swallows errors (Mach Cone had 337 silent catches).

### WP0.6 Test harness

Every command in MASTER 13.1 exists and runs, even where the suite is small:

- test:validation with bench M1 (free fall).
- test:golden with the cube-drop golden replay, in Node and through Playwright in Chromium, WebKit and Firefox.
- test:fuzz with random drop scenes.
- test:gpu with one kernel (for example a particle advection) against its CPU reference, plus WGSL validation.
- missions:verify wired with an empty mission set.
- test:e2e and test:e2e:smoke: boot, the cube visible by pixel readback, zero console errors, device-loss recovery, the WebGL2 path.
- test:visual, test:soak (a 5-minute version for now), perf:mac, and gate.
- verify:fast finishing in under 90 s.

### WP0.7 Continuous integration

GitHub Actions: ci.yml (every push), nightly.yml and deploy.yml (GitHub Pages, only after Ricky approves publishing). Upload reports, screenshots and traces as artefacts. Add a bundle size budget.

### WP0.8 Claude Code setup

Create CLAUDE.md (under 200 lines), .claude/rules (sim.md, gpu.md, content.md), the hooks, the five subagents, the five skills and the MCP configuration from MASTER 13.5. Prove the hooks work: on a scratch branch, introduce a type error and an invalid WGSL line, show the hooks blocking, then delete the branch.

### WP0.9 Documents

Complete docs/PROGRESS.md and create docs/features.json (P00 items only; each later phase seeds its own in its first session), DEFECTS.md, LEARNINGS.md, IDEAS.md, PHYSICS-CHANGELOG.md (physicsVersion 0.1.0), BASELINE.md, adr/0001-stack.md and the spike ADRs, architecture/SCHEDULE.md, and model-cards/mechanics-rigid.md.

## Benches

M1 free fall (MASTER 6.1).

## Gate

- [ ] Every command in MASTER 13.1 exists, is real (no bootstrap stubs left) and passes.
- [ ] The cube-drop golden replay gives identical hashes across three Node runs, in Chromium, WebKit and Firefox through Playwright, and in Chrome and Safari on Ricky's Mac, with frame pacing simulated at 30, 60, 120 and 144 Hz and time scales of 0.01x, 1x and 100x.
- [ ] Snapshot at tick 300, restore, run 600 ticks: the hash equals the uninterrupted run.
- [ ] Lint blocks Math.random, Date.now, Math.sin, Math.tanh, the ** operator and a non-allowlisted import in src/sim (a test proves each rule fires), and the throwing stubs are active in golden runs.
- [ ] Every dmath function has a maximum error of at most 2 ulp against the references over a million samples.
- [ ] E2E: interactive within 30 s under SwiftShader; zero console errors; pixel readback shows the cube; device loss recovers with the state intact.
- [ ] The WebGL2 fallback boots and draws the cube.
- [ ] CI is green on main; deployment works if Ricky approved it.
- [ ] Hooks, subagents and skills work, with evidence in the report.
- [ ] Spike ADRs exist with measured numbers, and the tick decision is recorded.
- [ ] perf:mac baseline recorded in docs/BASELINE.md (Ricky runs it if you are in the cloud).

## Ricky's playtest (10 minutes)

1. Open the deployed page in Chrome and in Safari on the Mac.
2. Watch the cube fall. Press R to replay. Check the HUD shows matching hashes.
3. Pinch to zoom and two-finger drag to orbit; say whether it feels right.
4. Read the summary at the top of docs/phases/P00-report.md and note anything unclear.

## Out of scope

Building tools, materials, other domains, missions, audio beyond a test tone.

## Risks and mitigations

- The deterministic Rapier build differs between engines (Node, Chromium, WebKit, Firefox): stop, raise it with Ricky, and test the -deterministic (non-compat) package and a different Node version before considering another engine. This is an architecture-level risk.
- SwiftShader boot is slow: keep shader compilation asynchronous, warm only what the first scene needs, and keep the 30 s budget honest.
- TypeScript 7 lint tooling gaps: use the TypeScript 6 API package for typescript-eslint or switch to Biome, by ADR.

## Stop and ask Ricky if

- Repository visibility, licence, hosting or publishing need a decision.
- Determinism fails across Node and Chromium after the mitigations above.
