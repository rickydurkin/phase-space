# PHASE SPACE - master prompt and specification

Programme version 1.0.0, 14/10/2026. Owner: Ricky. Builder: Claude Code. Working title: PHASE SPACE (rename freely).

This file is written to you, the Claude Code agent building the game. Part A is the core: read it in full at the start of every session. Part B is reference: read the sections the current task touches. The appendices hold templates and the reference set of games to beat.

---

# Part A - Core (read every session)

## 0. Purpose, precedence and reading order

You are the lead engineer, physicist and game designer for PHASE SPACE, a 3D physics sandbox game for the browser. You work in this repository over many sessions, guided by this file, the phase files in programme/phases/, and the working documents you keep in docs/.

When documents disagree, follow this order:

1. Ricky's latest explicit instruction in the session.
2. This file, Part A (non-negotiables and session protocol).
3. The current phase file in programme/phases/.
4. Accepted ADRs in docs/adr/.
5. This file, Part B.
6. Everything else (reference documents, research snapshot, mission catalogue).

If you find a real conflict, follow the higher item, record it under "Open questions" in docs/PROGRESS.md and raise it in your end-of-session report. Treat programme/ as read-only; your working documents live in docs/. Ricky updates programme/ with the upgrade prompt.

An ADR may not change any number, tolerance, budget, bench, check or gate set in this file or in a phase file unless the ADR records "Approved by Ricky on DD/MM/YYYY". Without that line the stricter value applies.

## 1. The brief

Build a world-class 3D physics sandbox game for the browser in which mechanics, heat, fluids, electricity and magnetism, light, gravity and sound share one world and affect each other. Players build freely in The Lab, then prove their understanding in First Principles, a campaign of missions that can only be solved by choosing and applying the right physics. The game must be deterministic, honest about its models, beautiful on Ricky's MacBook Pro (M4 Max) and dependable everywhere it runs.

What world-class means here (each claim is measurable; see section 12):

- The deepest cross-domain coupling of any browser game: at least seven physics domains exchanging energy through one audited ledger.
- Every mission ships with machine-checked proof that it is solvable, that the common misconception fails, and that guessing does not work.
- Every run replays bit for bit from seed and inputs, across frame rates, time scales, machines and JavaScript engines, in Node and in every supported browser.
- Every physics model has a model card and a validation bench that runs in CI and can be read in-game.
- Ultra tier holds 120 fps on the M4 Max in the reference scenes, and every mission is playable on the WebGL2 fallback.

The reference set of games and simulators to beat is in Appendix F. The dated research baseline is programme/reference/RESEARCH-SNAPSHOT-2026-10-14.md. Ricky's own simulators set the taste and supply the hard-won lessons: read programme/reference/LEARNINGS.md before Phase 1 and whenever you design a new system.

## 2. Non-negotiables

Each rule carries its reason. If a rule blocks you, stop and ask Ricky rather than working around it.

**2.1 Deterministic authoritative simulation.** Everything that decides an outcome (missions, scores, replays) runs in the Authoritative Simulation (AS): CPU only, fixed tick, seeded random streams keyed by cause, deterministic maths, no wall clock, stable iteration order. The same seed and inputs give the same state hash in Node and in every browser, at any frame rate or time scale. Reason: replays, ghosts, verified scores, branching time and automated testing all depend on it. Ricky's Mach Cone needed about 8,000 lines to retrofit determinism; here it is built in from the first commit.

**2.2 One world state, one timeline.** Rewind, scrub and branch restore a snapshot and re-simulate the input log. Visuals and audio are pure functions of authoritative state plus view time. No subsystem keeps its own rewind logic. Reason: per-module rewind was Mach Cone's largest source of cost and of failing tests.

**2.3 The GPU is for detail.** GPU compute (MPM fluids, smoke, fire, field grids, particles) makes the world richer to look at but never feeds back into AS state, except in The Lab's Unleashed mode, which is labelled "not deterministic, not scored". Reason: WGSL lets implementations reassociate and fuse floating-point operations, so GPU results are not bit-identical across devices.

**2.4 SI units and one source of truth.** Internally everything is SI, with unit types at module boundaries. There is one constants module (CODATA 2022) and one materials database in which every property has a source or an "est." flag. Display units follow the settings (UK defaults in section 10.6). Reason: Ricky's sims each kept their own constants, and physics copied between them drifted apart (two different spin-drift magnitudes, two Coriolis models).

**2.5 Honesty layer.** Every model has a model card. Every displayed number is labelled computed, anchored (calibrated to data) or estimated. Every setting and mutator carries a reality badge: Real, Plausible, Exaggerated or Impossible. No hidden fudge factors. The energy ledger raises a visible alarm when energy appears from nowhere. Reason: honesty is the signature of every sim Ricky has kept, and a trust instrument that is wrong (a drift badge that ignores active forces, a check that cannot fail) does more harm than having none.

**2.6 Tests are sacred.** Never delete, weaken, skip or loosen a test, tolerance or gate to make it pass. In docs/features.json you may only set "passes" and "evidence", and append new entries. A failing gate is reported, never hidden. A waiver needs Ricky's written approval, recorded in the phase report. Golden files count as tests: tests/golden/ changes only with a physicsVersion bump and an entry in docs/PHYSICS-CHANGELOG.md, and CI fails if the number of tests, benches or missions falls. Reason: a verifier that can be edited is not a verifier.

**2.7 Evidence before claims.** Never report something as working without the evidence: the command, its summary output, hashes, screenshots or trace numbers. "Should work" is not a status.

**2.8 Performance is a feature.** The budgets in section 12 are requirements. When the AS cannot keep up, drop time and show "running below real time". Never let load, frame rate or the time scale change a step size: step sizes are fixed per scene, or adapt only through deterministic rules that belong to the physics (for example orbital error control), and are recorded in replays. No main-thread task over 50 ms after first paint. Quality tiers change rendering and the detail layer only, never AS parameters.

**2.9 Clean runtime.** Zero uncaught exceptions and zero console errors in every automated run. Console warnings only from an allowlist in tests/console-allowlist.json, each entry with a reason. Reason: 30 of Ricky's 31 sims loaded with no console errors; keep that standard and enforce it.

**2.10 Pinned, bundled, offline.** Pin every dependency to an exact version and bundle it at build time. No runtime CDN imports. After first load the game works offline. Reason: runtime CDN loads stalled several of Ricky's sims (a CSG library took 12 s to arrive) and break offline play.

**2.11 Missions prove physics necessity.** A mission counts as content only when CI shows that the goal is not met at setup, the reference solutions pass, the trap (misconception) solutions fail and the guessing bot fails (section 7.6). Reason: the point of the game is that the right physics approach wins.

**2.12 Content anyone can share.** No human or animal targets. No catalogue of real-world firearms. Projectile content comes from sport, engineering, space, weather and history: trebuchets, air cannons, footballs, golf balls, hailstones, meteoroids. Reason: Ricky wants to show this to anyone, and his ballistics sims were harder to share for this reason.

**2.13 UK English and conventions.** British spelling, DD/MM/YYYY dates, 24-hour time, en-GB number formatting, °C by default, mph for road vehicles. In reports and in all player-facing text use plain hyphens rather than long dashes, straight quotes and no emoji.

**2.14 Small, reversible steps.** One feature at a time. Commit after each verified step with a descriptive message. Keep main green. Leave the repository clean at the end of every session.

## 3. Session protocol

Long programmes fail when sessions forget what happened. Follow this protocol every time. It follows Anthropic's published guidance on harnesses for long-running agents: an initialising first session, then incremental sessions that read progress notes, run checks before new work, work on one feature at a time, and leave a clean, committed state.

### 3.1 Start of session

1. Confirm the working directory and branch. Run `git status` and `git log --oneline -20`.
2. Read docs/PROGRESS.md: current phase, last session summary, open questions, next steps.
3. Read the current phase file and the docs/features.json entries for that phase.
4. Run `npm run verify:fast` and `npm run test:e2e:smoke`. If anything is red, fixing it is the first task. (Early in P00 these are bootstrap stubs that print NOT YET IMPLEMENTED; note that and carry on.)
5. At the start of a phase only, run the research refresh (section 16.1) and the planning step in the phase file.

### 3.2 During the session

- Pick the highest-priority failing feature in the current phase and work on it alone until its named verifier passes.
- Before anything that touches more than three files or adds architecture, write the plan to docs/phases/PNN-plan.md first, then proceed. Use interactive plan mode only when Ricky is present to approve it.
- Keep docs/PROGRESS.md under 150 lines; move older session notes to docs/progress-archive/.
- Keep your own context small. Research, wide code searches, reviews and play-testing go to subagents (section 13.6).
- When something surprises you, add one line to docs/LEARNINGS.md. When you have an idea outside the current scope, add it to docs/IDEAS.md and carry on.
- When you find a defect, give it an ID in docs/DEFECTS.md (D-001 onwards), write a failing regression test named after it, then fix it.
- Before marking a feature as passing, run its verifier, record the evidence, and for any non-trivial change have a fresh-context reviewer subagent check the diff against the requirement.

### 3.3 End of session

1. Update docs/PROGRESS.md: what changed, the evidence, what comes next (in order), open questions for Ricky.
2. Run `npm run verify:fast`. If it is green, commit everything to main with a summary message. If it is red and cannot be fixed this session, commit the work to a wip/ branch (never main), then commit only docs/PROGRESS.md to main with that branch's name in it so the next session finds it, and say so first in your report.
3. Leave the working tree clean.

### 3.4 End of phase

Run `npm run gate PNN` (for example `npm run gate P03`), which writes docs/phases/PNN-report.md. Ask the gate-reviewer subagent, in a fresh context, to try to refute the report; reviewers run `npm run gate PNN review`, which writes docs/phases/PNN-review.md and leaves your report untouched. Then prepare the playtest build and the checklist from the phase file, and ask Ricky to play it. Regression in later gates means the automated items of earlier gates; subagent reviews and playtests are not repeated. The phase closes only when every gate item passes (or carries a waiver Ricky has approved), Ricky's playtest notes are saved in docs/playtests/, and Ricky writes "close PNN". Then tag the release v0.N.0.

### 3.5 When to stop and ask Ricky

- A gate cannot be met without a waiver or a change of scope.
- A decision changes what the player experiences in a way this programme does not settle.
- Anything that costs money, needs an account, handles keys or personal data, or publishes something.
- Two different fixes for the same failure have both failed.

Otherwise make the call, record it in an ADR or in PROGRESS.md, and keep going.

### 3.6 Report format (end of session, to Ricky)

Short, in British English, in this order:

- Status: phase, features passed this session (n of m in the phase), gate status.
- Evidence: test summary lines, golden-hash status, performance numbers if measured.
- What I built, in two to five lines.
- Problems and decisions, with links to ADRs and defects.
- Next steps.
- Questions for you, only if needed.

---

# Part B - Reference (read the sections your task touches)

## 4. Game design

### 4.1 Pitch

Heat softens steel. Magnets drag molten metal. A lens lights a fuse. A shock wave knocks a tower down, and a falling satellite glows on re-entry. PHASE SPACE is a 3D sandbox where every force is real and every system talks to every other. Build anything in The Lab. Then prove you understand it in First Principles, where the right physics wins and guessing does not.

### 4.2 Pillars

Every feature must serve at least one pillar. If it serves none, it goes in docs/IDEAS.md.

1. One world, coupled physics. Interactions emerge from shared state and conserved quantities, never from scripts.
2. Physics is the puzzle language. Understanding beats trial and error: predict, calculate, choose the right model.
3. See the invisible. Instruments reveal fields, flows, stresses and energy. Every number has units and a source.
4. Time is a tool. Slow it, stop it, scrub it, branch it and compare timelines. Slow motion never changes the physics.
5. Honest and proven. Model cards, reality badges and validation benches the player can read.
6. Dependable. It loads fast, does not crash and never loses work.

### 4.3 Player and audience

The player is a curious engineer-scientist with a lab, a workshop and permission to experiment. The primary audience is Ricky: technically fluent, loves real data, many variables to tweak, cinematic slow motion and seeing science tested. The secondary audience is friends and family, teenagers included, so depth is layered with a setting borrowed from Worldline:

- Explorer: no equations, plain words, guided.
- Student: equations with the player's own live numbers.
- Physicist: full model cards, raw data, integrator and solver settings.

### 4.4 Modes

| Mode | What it is | What brings players back |
|---|---|---|
| First Principles | The campaign: realms of handcrafted missions (section 7) | stars, histograms, the insight star |
| The Lab | Sandbox with everything available: build, test, measure | freedom, codex discoveries, sharing |
| The Daily Experiment | One generated mission a day, the same seed for everyone; a weekly Grand Challenge in Optimise mode | daily habit, share card |
| Forensics Bureau | Case files: reconstruct what happened from the evidence | a randomised truth on every attempt |
| Chain Reaction | Rube Goldberg across domains: the score multiplies with each distinct domain the causal chain passes through (section 8) | creativity and efficiency |
| Constants Run | Roguelite: generated missions; after each win pick one of three Law cards that change a constant; the run ends at the first failure | stacking strangeness, shareable seeds |
| Evolution Bench | Choose free parameters and a fitness function; a genetic algorithm or CMA-ES evolves designs in headless workers | optimisation curiosity |
| Photo and Cinema | Path-traced stills and offline-rendered replay clips | sharing |

### 4.5 Realms

Each realm is a themed 3D environment with 6 to 14 missions, a sandbox version for The Lab and generator templates for the Daily Experiment.

| ID | Realm | Physics focus | Lineage in Ricky's sims | Phase |
|---|---|---|---|---|
| R1 | The Workshop | levers, friction, collisions, springs, pendulums, projectiles | Newton's Playground, Hertz Hall | P2 |
| R2 | The Foundry | heat, phase change, fire, expansion, casting | Thermal Camera Lab, Heat Flow Bench | P3 |
| R3 | The Harbour | buoyancy, hydrostatics, flow, waves, pipes, sand | Bernoulli's Garage | P4 |
| R4 | The Power House | circuits, motors, generators, magnets, induction | new | P5 |
| R5 | The Lighthouse | reflection, refraction, lenses, dispersion, solar heating | new | P6 |
| R6 | The Proving Ground | projectiles with drag and spin, sound, booms, blast | Mach Cone, Ballistica, Terminal Ballistics Lab, Demolition Reconstructor | P8 |
| R7 | The Test Track | tyres, grip, braking, aerodynamics, crash safety | Track Day, Crumple Lab | P9 |
| R8 | The Warehouse | centre of gravity, stability, load moments, tilt tests | Stability Triangle | P9 |
| R9 | Fault Line | resonance, earthquakes, isolation, dampers, failure | Shake Table | P9 |
| R10 | Launch Complex and Orbit | thrust, nozzles, staging, orbits, transfers, re-entry | Nozzle Lab, Gravity Well, Gravitas, Orrery | P10 |
| R11 | Other Worlds | the same physics on the Moon, Mars, Titan, Venus and Europa | Ballistica's world presets | P10 |
| R12 | The Edge (frontier) | slow light, time dilation, extreme gravity | Worldline, Star Forge | P12 |

### 4.6 Progression

- Stars open realms; thresholds are tuned in playtests. Instruments and tool sets arrive with realms and are taught in context.
- The Lab is open from the start with everything in it. Progressive disclosure keeps panels simple: Basic, Advanced and Expert levels. Ricky's sims put 30 to 43 sliders on one panel; here no panel shows more than eight controls at Basic level.
- The Phenomena Codex fills as the player reproduces phenomena in any mode (target: at least 100 entries by v1.0). Each entry has an explanation at all three depth levels, the governing equation, a real-world link with its source, and a challenge variant.
- Achievements reward insight (predictions within 5%, solving without hints), never grind.

### 4.7 Onboarding and feel

- Boot straight into a live Workshop scene. Within 10 seconds the player can grab, throw, stack and knock things over. The first mission prompt appears after the first interaction. Time to first fun is under 60 seconds, measured in playtests.
- Teach by doing: at most three new ideas per step, no failure states in the first five minutes, short text that explains why.
- Every action can be undone. Every control has a tooltip with units, range and a one-line explanation.
- Effects scale with the physics that caused them. Impacts, sparks, steam and booms are driven by the energy in joules, as in Newton's Exception, so the spectacle is itself a readout.

## 5. Simulation architecture

### 5.1 Layers

- Authoritative Simulation (AS): deterministic CPU simulation in a dedicated Web Worker, and in Node for tests and tools. It owns every piece of state that decides an outcome.
- Detail Simulation (DS): WebGPU compute on the main thread's GPU device: MPM spray and foam, smoke and fire volumes, field-visualisation grids, particles. Seeded from AS state each frame. Visual only.
- Presentation: the three.js WebGPURenderer scene, post-processing, instrument visuals, the audio engine and the UI, all on the main thread. Reads AS frames and DS buffers; writes nothing but player inputs.
- Headless pool: extra workers running AS instances for the trajectory predictor, Monte Carlo ensembles, optimisers and mission bots. The same code runs in Node for CI.

### 5.2 Threads and messages

- The main thread sends input commands stamped with their target tick. The AS worker posts render frames (transforms, temperatures, field samples, events) as transferable ArrayBuffers, at up to the display rate, with the data needed for interpolation.
- SharedArrayBuffer is not required. If an ADR adopts it (for example for audio), hosting must send COOP and COEP headers (section 11).
- Comlink handles control calls; raw transferables carry per-frame data.

### 5.3 Time

- The AS advances on a fixed tick of 1/120 s by default. The tick is fixed per scene and recorded in every replay. Scenes built for slow-motion study (impact labs, for example) may use 480 or 960 Hz ticks within budget. The Phase 0 spike measures the cost and confirms the default in an ADR.
- Each domain has its own deterministic clock inside the tick, fixed per scene and recorded in replays:
  - Mechanics: two substeps per tick by default.
  - Thermal and air: a fixed 30 to 60 Hz sub-schedule, with heavy work spread across ticks so no single tick spikes.
  - Fluids: CFL-limited substeps decided by deterministic rules.
  - Circuits: fixed substeps no longer than the smaller of 1/(40 f_max) and tau_min/10, where f_max is the highest frequency in the network (an LC resonance or an AC source) and tau_min its shortest time constant; L-stable integration (backward Euler or BDF2) for stiff networks; phasor analysis for steady-state mains networks.
  - Charged particles: the relativistic Boris pusher with at least 40 substeps per gyration, in a particle scene whose tick follows from the gyrofrequency. Long runs that depend on phase, such as a cyclotron, use closed-form gyration between gap crossings or at least 120 substeps per gyration, because the pusher's small frequency error accumulates.
  - Light: beams are instantaneous. Where a mission or instrument needs time of flight (Fizeau's wheel, a rangefinder), the delay is the optical path length over c, applied in closed form.
  - Orbits: their own f64 frame, with fixed-step symplectic integration for massive bodies and deterministic error-controlled Runge-Kutta for spacecraft; time warp up to 1e8x.
- The order of work inside a tick is fixed and documented in docs/architecture/SCHEDULE.md: inputs, fields, circuits, mechanics, fluids, thermal, air and combustion, optics, acoustic events, ledger, observers.
- The time scale changes how many ticks run per rendered frame, never dt. The range is 1/10,000x to 10,000x where the realm allows it (orbits excepted, above). Rendering interpolates between ticks. When one tick spans more than 1/30 s on screen, show an "interpolated" badge, because the player is then watching interpolated poses rather than new physics.
- Fast phenomena (projectiles, shocks, sparks, particles) use models that can be sampled at any view time: closed forms, or a fixed fine grid with Hermite output as in Mach Cone. The high-speed camera therefore shows real motion between ticks.
- Budget: at most 48 ticks per rendered frame by default. Beyond that, time drops and the HUD shows "running below real time" with the achieved rate.
- Scheduled events (a motor starting, a valve opening, a burn) fire at exact sim times by splitting the tick deterministically.

### 5.4 Determinism rules

Enforced by lint, by tests and in review:

- No Math.random, Date, performance.now or crypto.getRandomValues anywhere in src/sim.
- In src/sim only these Math functions are allowed: sqrt, abs, min, max, floor, ceil, round, sign, fround, trunc, imul and clz32. Constants such as Math.PI and Math.E are allowed. Every other Math function, and the ** operator, is a lint error. src/sim/dmath (fdlibm-derived, unit-tested against high-precision values to within 2 ulp) provides the transcendental functions. Golden runs in Node execute the AS inside a worker_threads worker whose globals are stubbed so that Math.random, Date, performance.now and every non-allowed Math function throw; stubbing them across the whole test process would break the test runner itself. Reason: transcendental results differ between JavaScript engines and engine versions; in August 2026 a physics library recorded different state hashes on two V8 releases because of Math.sin and Math.cos.
- src/sim may import only allowlisted packages: the pinned Rapier deterministic build and bitECS. Adding one needs an ADR with a determinism test.
- Golden replays run in Node (V8) and, through Playwright, in Chromium (V8), WebKit (JavaScriptCore) and Firefox (SpiderMonkey). The AS needs no GPU, so cross-engine determinism is tested from P0 rather than discovered in P11.
- Random numbers come from src/sim/rng: a counter-based or PCG-family generator with streams keyed by cause, for example rng.stream("fracture", entityId, tick). Adding a new random consumer never shifts any other stream.
- Entities are created and iterated in ID order.
- Rapier: use the cross-platform deterministic build, pinned to one exact version. Insert bodies in a stable order. Never mix builds within one replay.
- GPU results never enter the AS (rule 2.3).
- State hash: FNV-1a 64 over a canonical serialisation of AS state, every 60 ticks during tests, compared against golden files in tests/golden/.

### 5.5 World state and data model

- Entities with components stored as structure-of-arrays typed arrays in the AS (bitECS 0.4 by default; an ADR may change this). Rapier holds rigid-body internals and the AS keeps the mapping.
- A snapshot holds AS components, the Rapier snapshot, domain state, RNG counters and the tick. Snapshots go into a ring buffer every 2 s of sim time (120 s deep by default) for scrubbing; the input log covers the gaps.
- A replay file holds gameVersion, physicsVersion, scene or mission id and version, seed, dt, the input log, optional checkpoints and periodic hashes. It is small enough to share in a URL for a typical mission.
- physicsVersion follows semantic versioning. Any change that alters a golden hash bumps it and is listed in docs/PHYSICS-CHANGELOG.md. Replays carry their version, CI re-validates every mission solution when it changes, and leaderboards are kept per physics major version. Reason: players hate updates that silently break their creations; a gravity change in Stormworks in 2023 broke players' ships.

### 5.6 Coupling

All domains talk through AS state and a typed event bus, and every energy transfer is booked in the ledger with a cause ID. The coupling matrix for v1.0:

| From \ To | Mechanics | Thermal | Fluids and air | Circuits | Fields | Optics | Acoustics |
|---|---|---|---|---|---|---|---|
| Mechanics | contacts, joints | friction and impact heating | displacement, waves, drag reaction | generators (through fields) | moving magnets and conductors | moving mirrors and lenses | impact sound, booms |
| Thermal | expansion, softening, melting into liquid | conduction, radiation | convection, boiling, melt layers | resistance changes with temperature, thermocouples | Curie point weakens magnets | incandescence, heat shimmer | crackle, hiss |
| Fluids and air | buoyancy, drag, lift, flow forces | convective heat transfer | advection, mixing | turbines and pumps (through mechanics) | none | absorption, refraction in water | splashes, bubbles, wind |
| Circuits | motors, solenoids | Joule heating | pumps, fans | the network itself | electromagnets | lamps, LEDs, lasers | hum, buzzers |
| Fields | magnetic and electric forces and torques | eddy-current heating | MHD (frontier only) | induced EMF | superposition | none | none |
| Optics | radiation pressure (Exaggerated mode only) | absorbed light heats | none | photocells, solar panels | none | reflection, refraction | none |
| Acoustics | blast impulse, resonance | none | none | microphones | none | none | propagation |
| Combustion | blast impulse | heat release | smoke, oxygen use | none | none | flame light | roar, crackle |

Couplings arrive phase by phase. Each one has a bench or test proving its energy bookkeeping, for example Joule heat equals the integral of I^2 R within 1%.

### 5.7 Energy ledger

Each domain reports its stores (kinetic, gravitational, elastic, internal thermal, latent, chemical, electrical, field, radiant energy in flight, acoustic energy in flight) and its transfers every tick, with cause IDs. The ledger checks that the change in total equals external inputs (player work, sunlight, batteries booked as chemical) minus losses to the environment.

- Internal thermal energy is measured from the scene's reference temperature (default 293.15 K), not from absolute zero, so totals stay meaningful.
- Friction, restitution, plastic deformation and fracture losses are booked from contact impulses and relative velocities.
- The solver residual is what remains of the change in mechanical energy after modelled forces and booked losses. It is shown as its own line and has its own budget over the window: the largest of 1% of the contact work, 0.5% of the gross energy moved, and 1 J. The floor matters because first-order integrators drift: a 2 s free fall at 240 Hz is about 0.2% out in energy. The mechanics benches confirm the figure.
- Unexplained creation is judged against the gross energy moved between stores, not the total. If it exceeds 0.5% of that, or 1 J, whichever is larger, over any 10 s window, or the solver residual exceeds its budget, the HUD raises "energy created" with the cause chain and mission evaluation marks the run invalid.
- Negative controls: injecting unbooked energy at 2% of the gross energy moved (and at least 2 J) over 10 s must trip the alarm, in a quiet scene and in a busy one.
- Conserved quantities in the air grid (heat, smoke, oxygen, fuel) are advected in flux form so they are conserved to rounding. Air kinetic energy is small; its numerical dissipation is booked as its own line.
- The Lab lets the alarm be silenced only for Impossible mutators.

Reason: Oxygen Not Included players farm every place where its heat model fails to conserve energy; ours must not have such places, and the alarm must be able to fire.

### 5.8 Scales and handoff

- Rapier works in single precision, so keep gameplay scenes within about 2 km of a floating origin for millimetre fidelity. Orbital work uses f64 integrators in its own frame (section 6.8).
- Multi-fidelity handoff is an engine API: handoff(entity, fromModel, toModel) transfers mass, centre of mass, inertia, momentum, angular momentum and energy, asserts conservation and logs the event. Uses: a crash structure's crush model to rigid debris (Crumple Lab), a forklift's analytic stability model to Rapier at the point of no return (Stability Triangle), a projectile integrator to a rigid body at impact, orbit to surface and surface to orbit.

### 5.9 Module interface

Every domain module implements:

```ts
interface DomainModule {
  init(world: World, config: DomainConfig): void;
  step(world: World, dt: Seconds, ctx: StepContext): void;
  observe(world: World, sink: ObservationSink): void;
  serialise(): Uint8Array;
  deserialise(bytes: Uint8Array): void;
  validate(): BenchResult[];
  modelCards(): ModelCard[];
}
```

No module imports DOM, three.js or GPU code (a dependency-cruiser rule enforces this), and every module runs under Node. Ricky's best cores (CrashLab, TD, ST, PHYS) already followed this pattern: no DOM, testable in Node.

## 6. Physics domains

Tolerances are relative unless stated otherwise. Bench IDs are stable and never reused. Each bench is a Vitest test in tests/validation/<domain>/, appears in the in-game Lab Book, and is cited in the relevant model card in docs/model-cards/. A mission may rely on an effect only if the effect is at least five times the combined tolerance of the models involved (section 7.6, check 9).

Bench rules:

- Parameters live in tests/validation/benches.json, chosen at the edge of what missions will use (stiffest spring, fastest body, highest frequency) and frozen in the phase plan. Changing them needs Ricky's approval (section 0).
- Every bench has a negative control: a deliberately broken variant that must fail, proving the bench can fail.
- A bench that compares a model with its own formula does not count. Test the system around the model (a tank draining through a pipe, combustion heat arriving in other domains) or compare with published measurements.

### 6.1 Mechanics (P1)

- Rigid bodies through Rapier: primitives, convex hulls, compounds, static triangle meshes and heightfields. Materials set density, static and kinetic friction, restitution and rolling resistance.
- Joints: fixed, hinge, slider, ball, rope and spring-damper, motorised versions, and gears and belts as velocity couplings. Breakable joints with force and torque limits derived from material strength and the joint's section; each fracture is logged with its energy.
- Brittle parts can be pre-fractured into Voronoi cells from a seeded stream and bonded by breakable joints (Hertz Hall did exact Voronoi fracture with Math.random; here the seeds are deterministic).
- Aerodynamics per body: quadratic drag with orientation-dependent projected area and Cd tables per shape, lift for plates and aerofoils (thin-aerofoil lift slope with stall), Magnus force and spin decay for spinning spheres, drag crisis for balls.
- Continuous collision detection for fast bodies; deterministic sleeping; gyroscopic torque enabled (Rapier's option, or the term added by hand), without which the Dzhanibekov flip cannot appear.
- An optional rotating reference frame per realm (Coriolis and centrifugal forces) for Coriolis deflection, Foucault pendulums and long-range projectiles.
- Soft bodies (rope, cloth, jelly): Rapier 0.21 added soft bodies with FEM and tearing. Use them only after a P1 spike proves they are deterministic and included in snapshots; otherwise use segmented ropes and beams.
- Benches:
  - M1 free fall, position at 2 s within 0.5% of the analytic value.
  - M2 projectile range without drag within 0.5%.
  - M3 pendulum period at 5° amplitude within 0.2%.
  - M4 equal-mass elastic collision: momentum within 0.1%, kinetic energy within 1%.
  - M5 block on an incline with friction: acceleration within 1%, slip angle within 0.5°.
  - M6 solid sphere, hollow sphere, solid cylinder and hoop rolling without slipping: accelerations within 1%.
  - M7 spring-mass at 1 Hz using the game's own spring-damper joint with damping off: period within 0.5%, amplitude change under 1% over 20 periods (choose an energy-conserving implementation; an implicit spring that bleeds energy fails).
  - M8 torque-free spin: angular momentum within 0.5% over 10 s, and the intermediate-axis flip (Dzhanibekov effect) appears.
  - M9 ten-box stack drifts less than 1 mm in 60 s.
  - M10 a 1 cm sphere at 500 m/s never tunnels through a 5 cm plate.
  - M11 Atwood machine acceleration within 1%.
  - M12 terminal velocity with quadratic drag within 1%.

### 6.2 Thermal (P3)

- Every body has thermal nodes: one (lumped) by default, or a segmented 1D, 2D or 3D grid of up to 64 nodes for rods, plates and blocks where gradients matter.
- Conduction between touching bodies uses the contact area from Rapier's contact manifolds and an interface conductance; conduction inside bodies follows Fourier's law.
- Convection uses natural and forced correlations with local air speed and temperature from the air grid. Radiation, epsilon sigma (T^4 - Tenv^4), is linearised each step so it cannot overshoot. Thermal Camera Lab's explicit T^4 step overshot and clamped vacuum cells to 1 K; that artefact must not exist here.
- Implicit time stepping (backward Euler) with a fixed-iteration conjugate-gradient solve and a residual check, at 30 to 60 Hz.
- Melting, freezing and boiling use the enthalpy method with latent heat. Melted solids hand off to fluid layers; molten metal solidifies into cast bodies. Until liquid layers exist (P4), casting uses a 0D mould-fill model: mass flow from the crucible's tilt, heat loss to the mould, and a misrun if the metal freezes before the mould is full.
- Temperature-dependent properties: yield strength, viscosity, electrical resistivity, magnet remanence up to the Curie point, and optionally emissivity.
- Thermal expansion for flagged parts: rods, rails, and bimetal strips modelled as two-layer beams.
- Incandescence: blackbody colour and emitted power feed rendering and optics.
- Benches:
  - T1 Newton cooling within 1%.
  - T2 semi-infinite rod against the erf solution within 3% at 60 s.
  - T3 heat flux through a composite wall within 1%.
  - T4 radiative cooling in vacuum within 2%.
  - T5 ice-melt plateau duration (mL/P) within 2%.
  - T6 boiling point against pressure (Antoine equation) within 1 K.
  - T7 linear thermal expansion within 1%.
  - T8 two bodies mixing in isolation: equilibrium temperature within 0.5%.

### 6.3 Air, wind and combustion (P3)

- A coarse Eulerian air grid over the active play volume (default 32 x 16 x 32 cells, up to 48 x 24 x 48 where a scene needs it and the budget allows, fixed per scene): semi-Lagrangian advection for velocity, flux-form advection for conserved scalars, a fixed-iteration multigrid or preconditioned conjugate-gradient pressure projection, and Boussinesq buoyancy; it carries velocity, temperature, smoke, oxygen and fuel vapour.
- Fans, nozzles and air jets narrower than a grid cell use an analytic round-jet model (Gaussian profile, linear spreading, momentum conserved), badged Plausible.
- Atmosphere: International Standard Atmosphere layers with humidity, plus per-realm presets for Earth, the Moon, Mars, Titan and Venus. Wind is a seeded pure function of position, time and seed (a mean profile with shear plus a gust lattice), as in Mach Cone.
- Combustion: each fuel has an ignition temperature, a heat of combustion and a burn rate limited by local oxygen. Burning produces heat, smoke, light and mass loss. Water and CO2 put fires out by cooling and by displacing oxygen. Explosive materials hand off to the blast model (6.9).
- Benches:
  - C1 ISA density and speed of sound at 0, 5 and 11 km within 0.1%.
  - C2 combustion heat arrives in the thermal and air domains plus radiated energy within 1% of mass burnt times heat of combustion (a ledger test across modules).
  - C3 a buoyant plume rises and conserves heat within 2%.
  - C4 the wind field is a pure function: identical samples for identical inputs.

### 6.4 Water, liquids and granular matter (P4)

- Open water: shallow-water equations on a heightfield grid, using a well-balanced finite-volume scheme with wet and dry fronts, Manning bed friction and CFL-limited substeps, at a fixed resolution per scene.
- Vessels and plumbing: 0D tanks connected by pipes, valves, pumps and turbines (Bernoulli and Torricelli with Darcy-Weisbach losses). This gives siphons, canal locks, water clocks, hydraulics and hydro power.
- Body coupling: buoyancy from exact submerged volume (convex hulls clipped against the local water surface) and drag from sampled depth and velocity; bodies displace water through source terms. Two-way and deterministic.
- Viscous liquids (lava, molten metal, oil) as additional layers with temperature-dependent viscosity that cool into solids.
- Boiling heat transfer by regime (nucleate, transition and film) with a Leidenfrost temperature per liquid and surface, badged Plausible; small liquid drops as tracked bodies of liquid.
- Granular matter: sand and gravel heightfields with angle-of-repose relaxation, digging and pouring; small piles as rigid clumps.
- Detail layer: MLS-MPM spray, splashes and foam seeded from AS fluxes, drawn with screen-space fluid rendering. The Lab's Unleashed mode runs full GPU MPM with two-way coupling, labelled not deterministic and not scored.
- Benches:
  - F1 hydrostatic pressure within 0.5%.
  - F2 floating prismatic hull in still water: draft within 0.2% (exact submerged volume).
  - F3 Torricelli efflux speed within 5%.
  - F4 shallow-water wave speed within 3%.
  - F5 dam-break front position against Ritter's solution within 10%.
  - F6 angle of repose within 2°.
  - F7 fluid mass conserved within 0.01% over 10 min.
  - F8 a tank draining through a long thin pipe (laminar): drain time against the analytic integration within 2%.
  - F9 a tank draining through a short wide pipe (turbulent, Colebrook friction factor): drain time against a high-precision reference integration within 3%.

### 6.5 Circuits (P5)

- Modified nodal analysis with companion models (trapezoidal for non-stiff networks, backward Euler or BDF2 for stiff ones) on the substep rule in 5.3, and Newton iterations for non-linear parts with a fixed iteration cap and a convergence check.
- AC sources and transformers (coupled inductors) for transient work; phasor analysis for steady-state mains networks such as a village grid.
- Components: cells and batteries (internal resistance, capacity), wires whose resistance follows from material and size, resistors, switches (manual, pressure, reed, bimetal), lamps whose filament resistance rises as they heat and which glow by incandescence, LEDs, DC motors and generators (k_t, k_e, R, L), capacitors, inductors and coils, relays, transistor switches, comparators and logic gates (a digital layer for contraptions), solar cells, thermocouples, thermistors, photodiodes and Hall sensors.
- Couplings: Joule heating to thermal, motor torque to mechanics, coils to fields, lamps to optics.
- Benches:
  - E1 resistor networks match a direct solve within 1e-9.
  - E2 RC and RL circuits with tau = 1 ms: time constants within 0.5%; an LC circuit at 1 kHz: frequency within 0.5%; all at the substep rule in 5.3.
  - E3 Joule heat equals the integral of I^2 R within 1%.
  - E7 DC motor stall torque and no-load speed within 1%.

### 6.6 Fields: magnetism and electrostatics (P5)

- Permanent magnets as dipoles (moment from remanence and volume), electromagnets from coil current, induced dipoles in ferromagnetic bodies (fixed-point iteration with saturation), and the Curie point from thermal.
- Current-carrying wires as line sources (Biot-Savart for straight segments), so a buried cable or a wire over a compass behaves correctly.
- Forces and torques from dipole-dipole expressions, with a near-field correction for coils where it matters; the model card states the valid range.
- Induction: EMF from the rate of change of flux through each coil. Eddy-current damping on conductors moving near magnets is velocity-proportional, with a coefficient from conductivity and geometry (model card).
- Electrostatics: charged bodies with softened Coulomb forces; charged particles integrated with the relativistic Boris pusher on the particle clock in 5.3.
- Benches:
  - E4 on-axis dipole force: law exponent within 0.02, magnitude within 2%.
  - E5 Faraday EMF within 3%.
  - E6 cyclotron radius within 0.5% at 40 or more substeps per gyration, energy drift under 0.1% over 100 orbits.
  - E8 a magnet falling through a copper tube: terminal speed within 15% of published measurements for the same magnet and tube (source on the model card), and within 1% of the model's own analytic prediction.
  - E9 the field of a long straight wire at two distances within 1% of mu0 I / (2 pi r).

### 6.7 Optics (P6)

- Beam tracing on the CPU for the sun, lamps and lasers: exact intersections with analytic optical parts (spherical lens surfaces, planes, prisms, parabolic mirrors) and Rapier ray casts for everything else.
- Snell refraction, Fresnel reflectance (unpolarised; polarisation and Brewster's angle as a P6 stretch goal), total internal reflection, dispersion from Cauchy or Sellmeier coefficients (3 to 7 wavelengths for gameplay), Beer-Lambert absorption and Lambertian surfaces.
- The sun is an extended source 0.53° across, so a focused spot has a finite size (about focal length x 0.0093) and a finite peak irradiance.
- Absorbed power heats bodies; irradiance drives photocells and solar panels.
- Time of flight, where needed, comes from optical path length in closed form (5.3).
- Rendering adds volumetric beams, caustics and spectral colour on the GPU.
- Benches:
  - O1 Snell refraction angle within 0.01°.
  - O2 critical angle within 0.01°.
  - O3 thick-lens focal length against a paraxial trace within 1%.
  - O4 normal-incidence reflectance within 0.5%.
  - O5 prism minimum deviation within 0.05°.
  - O6 Beer-Lambert attenuation within 0.5%.
  - O7 solar-furnace heating rate matches the thermal module within 2%.
  - Stretch, with polarisation: O8 Malus's law within 0.5%; O9 Brewster's angle within 0.1°.

### 6.8 Gravity and orbits (P1 uniform, P10 orbital)

- A uniform gravity vector per realm or mutator. Point masses in The Lab (softened, applied as forces).
- Orbital realm: f64 N-body for the massive bodies with fixed-step symplectic integration (Yoshida 4th order or Wisdom-Holman); spacecraft with deterministic error-controlled Runge-Kutta against interpolated planet positions; burns at exact times; an accuracy banner; time warp up to 1e8x; an optional first post-Newtonian (1PN) correction. Patched handoff to surface physics near bodies.
- Tools: Lambert solver, porkchop plot, Hohmann and bi-elliptic planners, Lagrange points, Hill and Roche radii.
- The trajectory predictor runs the same integrator on a forked copy of the world. All three of Ricky's gravity sandboxes drew predicted paths that disagreed with their own simulations (frozen planets, a different integrator, a different step); that must not happen here.
- Benches:
  - G1 circular orbit period within 1e-6 over 100 orbits.
  - G2 Hohmann transfer delta-v within 0.1%.
  - G3 escape speed within 0.1%.
  - G4 1PN perihelion advance for a Mercury-like orbit within 2%.
  - G5 Tsiolkovsky delta-v within 0.1%.
  - G6 Earth-Moon L1 position against the exact collinear root of the restricted three-body problem within 0.1% (the Hill approximation is about 5.6% off here, so do not use it as the reference).

### 6.9 Sound, shock and blast (P1 basic impact sound, P8 full)

- Event-based propagation: the speed of sound comes from local temperature, with wind advection; delay lines give arrival time and Doppler shift; spherical spreading plus ISO 9613-1 absorption; occlusion by ray tests. A distant impact is seen before it is heard.
- Microphones as instruments: arrival times, levels and a spectrogram.
- Resonance: driven oscillators with Q from damping. Glass and brittle parts fracture when stress exceeds strength.
- Blast: scaled-distance overpressure and impulse (Kingery-Bulmash or Friedlander fits, with the valid range on the model card), applied to bodies at the arrival time.
- Supersonic bodies: Mach cone geometry, boom events when the listener crosses the cone (solved in retarded time) and N-wave synthesis. For booms reaching the ground, acoustic rays are traced through the layered atmosphere's sound-speed profile, which gives the boom carpet its finite width and lateral cutoff.
- Benches:
  - A1 speed of sound at 15 °C within 0.1%.
  - A2 Doppler shift within 0.5%.
  - A3 Mach angle within 0.1°.
  - A4 arrival delay at 1 km within 1 ms.
  - A5 blast overpressure against the reference curve within 10%.
  - A6 driven damped oscillator: the amplitude peak lies at omega_n sqrt(1 - 2 zeta^2) within 0.5%, tested at Q = 2 and Q = 50.

### 6.10 Kits built on the domains

- Projectiles (P8): a fast-body integrator (RK4 on a fine fixed grid with Hermite output and swept ray hits), Cd(Mach) tables for spheres, cylinders and fin-stabilised shapes, wind sampling, Coriolis, spin and Magnus; hands off to rigid bodies at impact. Benches: PJ1 drag trajectory against a high-precision reference within 0.1% of range; PJ2 Magnus deflection within 2%; PJ3 Coriolis deflection within 2%.
- Vehicles (P9): a Pacejka-style tyre model with combined slip, drivetrain and differentials, aerodynamics, brakes that heat and fade through the thermal domain, a lumped crush structure with handoff to rigid debris, and crash-dummy metrics (HIC, chest g). Benches: V1 braking distance within 2%; V2 cornering at the grip limit within 2%; V3 crush pulse against a calibration target.
- Structures (P9): segmented beams with E, I and yield, breakable joints, a modal analysis tool, base excitation, tuned mass dampers and isolation bearings, and a pedestrian lateral-loading model with synchronisation for footbridges (badged Plausible, with the critical crowd size on the model card). Benches: S1 cantilever deflection within 3%; S2 single-degree-of-freedom frequency within 0.5% and damping ratio within 2%; S3 Euler buckling load within 5%.
- Materials handling (P9): generic counterbalance and multidirectional sideloader trucks (no real brands), mast and load, the stability polygon and zero-moment-point margin, tilt-table tests in the style of ISO 22915, and handoff to Rapier at the point of no return. Benches: W1 static tip-over load moment within 1%; W2 tilt-table angle within 0.5°.
- Rockets and entry (P10): a quasi-1D isentropic nozzle (expansion ratio, exit against ambient pressure, separation warning), mass flow and staging, aerodynamic heating on re-entry, meteoroid ablation and crater scaling (pi-group scaling, badged Plausible). Benches: RK1 sea-level and vacuum thrust and specific impulse of a documented engine within 8% of published figures (Nozzle Lab's Merlin estimate was about 6% high); RK2 staging delta-v within 0.1%.

## 7. Missions

### 7.1 What a mission is

A mission is data (content/missions/<realm>/<id>.json, with its schema in src/content/schema.ts) plus solutions: at least one reference and at least one trap. For a mission without randomised inputs a solution is a replay. For a randomised mission it is a solver script: a deterministic function that receives only the Observe API readings available through the mission's allowed tools in that attempt (never hidden state) and returns the inputs, so it works across the whole randomised range; CI stores the replay it produced for each verified seed. Missions run entirely in the AS so they can be verified in Node.

### 7.2 Mission modes

| Mode | The player | Device that defeats guessing |
|---|---|---|
| Build | designs a contraption under constraints | part budget, cost per test run |
| Predict | commits a prediction (number with unit, choice or sketch), then watches | prediction locked before the run; scored on error |
| One-Shot | sets parameters and commits once | no preview, one attempt, fresh numbers each attempt |
| Investigate | measures evidence and infers hidden values | randomised truth on every attempt; the answer is graded |
| Control | pilots or operates in real time | par time; penalties that encode correct practice |
| Optimise | minimises metrics | histograms and Pareto front |
| Futures | designs something that succeeds across N seeded variations | pass rate and worst-case margin |
| Discover | reproduces a named phenomenon | the codex checks the physical signature |

### 7.3 Mission schema

Fields: id, slug, version, realm, title, briefing (at most 80 words, en-GB), principles[], mode, difficulty (1 to 5), estimatedMinutes; scene (seed, world, settings, initial entities, allowed parts, materials and tools, budget, energy budget, time limit, mutators with badges); parameters[] (what the player sets, with ranges and steps); randomised[] (values drawn afresh on every attempt from a seeded stream, with ranges); derived[] (named expressions over randomised inputs and scene constants, such as maxSafeCargo); attempts and runCost; objective (a predicate over AS state in the objective DSL); failConditions[]; prediction (type, unit, tolerance bands), if any; metrics[] (cost, energy, time, mass, parts, margin, error); stars (objective, efficiency threshold, insight rule); hints[5]; debrief template; modelCards[]; realWorld (a link with its source); solutions (reference[], traps[], each a replay or a solver script with a named approach or misconception, as in 7.1); necessity (bot type, attempt budget, maxSuccessRate, and the separating quantity with the benches that validate it). Appendix B has a complete example that validates against the schema.

In the objective DSL, `for` applies to the parenthesised expression before it, and parentheses are required: `(inZone("crate", "dock") && speed("crate") < 0.5) for 2 s`. Thresholds may refer to derived values computed per attempt from randomised inputs, for example `cargo("barge") >= 0.95 * maxSafeCargo`.

### 7.4 Stars and scoring

- Star 1, Objective: the predicate holds.
- Star 2, Efficiency: a named metric beats the mission's threshold.
- Star 3, Insight: the committed prediction was within tolerance, or the mission was solved in one attempt, or the player chose the cheapest adequate model (Model Ladder), in each case with no hint beyond level 2. Viewing the reference solution forfeits star 3. This combines Worldline's predict-first star with Mach Cone's rule that using the automatic solver caps a mission at two stars.
- Every metric also feeds a histogram (section 8).

### 7.5 Hints, debriefs and depth

- A five-level hint ladder: 1, which principle applies; 2, which instrument to use; 3, the governing equation in symbols; 4, a worked example with different numbers; 5, the reference solution replay. Hint use is recorded.
- A debrief after every run, written from the recorder: the event timeline, the governing equation with the player's own numbers, the prediction against the result, the trap explained if the player fell into it, a real-world connection with its source, and a "branch and try" button. Debriefs use plain verdict sentences that quote numbers, as Crumple Lab's verdict() and Newton's Exception's scenario verdicts did.
- Text adapts to the depth level (Explorer, Student, Physicist).

### 7.6 Physics necessity: the proof every mission must pass

`npm run missions:verify` runs these checks for every mission, in Node:

1. Not met at setup: the objective is false at tick 0 and stays false for 10 s with no input.
2. Reference solutions pass deterministically, with their hashes recorded, across the randomised range. Open-ended missions need at least two references that use different physical approaches.
3. Trap solutions fail on the named predicate. A trap is the reference solution with only the misconception's parameters changed, so it cannot fail for an unrelated reason. Each trap names its misconception, for example "heavier objects fall faster", "bulbs use up the current", "in orbit, burn towards the target".
4. Guessing bots, per mode, over 200 seeded runs with the mission's attempt budget:
   - One-Shot and Predict: a uniform guess over the allowed inputs succeeds at most 5% of the time.
   - Build: a random builder within the budget succeeds at most 10% of the time.
   - Investigate: an answer drawn from the prior, without measuring, succeeds at most 5% of the time.
   - Control: a naive controller that ignores the dynamics (for example bang-bang straight at the target) succeeds at most 10% of the time.
   - Optimise: the reference beats a naive design by at least 20% on the star 2 metric.
   - Discover: the phenomenon detector fires on fewer than 1% of random Lab scenes.
   - Wherever attempts give feedback, an adaptive bot (bisection on the observed miss, with no physics) must also stay under the threshold.
5. Futures missions: the reference passes at or above the target rate across N seeds and the best trap does not.
6. Prediction keys: the correct-model answer lies inside the tolerance and each listed misconception's answer lies outside it. Predict missions draw fresh inputs on every attempt, so answers cannot be memorised.
7. The mission runs within its time budget with a clean energy ledger.
8. Text: en-GB spelling, the banned-characters lint and the 80-word briefing limit.
9. Signal against tolerance: the physical effect that separates the right answer from the trap is at least five times the combined tolerance: the sum of the tolerances of the benches that validate the separating quantity, which each mission names in necessity.separating (for example freeboard: F2). References clear, and traps miss, every threshold by at least the combined tolerance; star and prediction bands are at least twice it.
10. Model coverage: every model the mission relies on is listed in modelCards and has passing benches. A mission that needs physics the engine does not model is not shipped.

Tutorial missions run checks 1, 2, 7 and 8 only, because the first minutes have no failure states (4.7). A mission that fails any applicable check is not shipped. Generated missions (Daily Experiment, Constants Run) pass the same checks before they are offered.

Cost control: results are cached by mission content hash and physicsVersion. On every push CI verifies changed missions plus a seeded sample; the full set runs nightly and at every gate.

### 7.7 Content pipeline

You write missions as data. For each one: draft the physics brief (principle, right approach, trap, numbers); compute the expected values by hand or by script; build the scene; write the reference and trap solutions (replays recorded with the test API, or solver scripts for randomised missions); run missions:verify; then ask the mission-critic subagent to play it cold and judge clarity, fun and necessity. programme/reference/MISSION-CATALOGUE.md is the seed list. Extend it in content/, not in programme/.

## 8. Replayability systems

- Histograms and Pareto fronts for every mission (cost, energy, time, parts, margin), local first, with reference distributions shipped from bots and development runs. Opus Magnum showed that players optimise for their place on a histogram without any other reward.
- The Daily Experiment: generated from per-realm templates with the UTC date as seed, the same for everyone; a weekly Grand Challenge in Optimise mode; a plain-text share line plus a PNG card. CI proves the next 400 days of Dailies and Weeklies (checks in 7.6) into a manifest that ships with the game, so the game never has to prove them itself. If the date runs past the manifest, the game offers the most recent proven challenge and says so.
- Chain Reaction scoring: score = base x 1.5^(k - 1) x efficiency, where k is the number of distinct domains the causal chain passes through from trigger to goal (found from the ledger's cause IDs), and efficiency is the energy delivered to the goal divided by the energy released from the declared sources (initial potential and kinetic energy, fuel, batteries, sunlight during the run).
- Procedural generation: template with parameter ranges, then a candidate, then a reference solver or optimiser proves it solvable, then the guessing bot proves it needs thought, then it is accepted. Use hand-authored chunks for layouts where fully generated geometry would feel random (Noita's Wang-tile lesson).
- Branch and compare: scrub the timeline, branch at any tick, change one variable, run, and compare the timelines as ghosts with a difference readout. This generalises Hertz Hall's recorder with "Resume here" and Terminal Ballistics Lab's same-seed ghost.
- Ghosts and sharing: replays are seed plus inputs; share them as a URL fragment (deflate-raw, base64url, with versions) or as a file; "beat my ghost".
- Lab to mission: any Lab scene can become a mission with the objective editor. The author must record a passing solution before it can be shared (Opus Magnum's workshop rule), and the guessing bot runs locally.
- Mutators and Law cards with reality badges (Moon gravity, thin air, slow sound, sticky world, weak magnets, cold universe). Stacking them raises the score multiplier in Constants Run. Constants Run proves each generated mission in the browser: 50 bot attempts per guessing check, accepting the mission only if at most one succeeds, within 10 s; when time runs out it draws from a pool proven in CI.
- Phenomena Codex, insight achievements, photo mode and clip export.
- Global leaderboards are a frontier option: a server re-simulates each submitted replay with the same AS build in Node before accepting it, checks that inputs are humanly plausible, and keeps boards per physics major version.

## 9. Instruments and the honesty layer

All instruments are widgets on one observation bus (the Observe API). Domains publish typed quantities with units; the recorder stores them for scrubbing; graphs, readouts, probes and debriefs all read from the bus. No instrument computes physics on its own.

Instruments, with the realm that introduces each:

- R1: tape measure and protractor; chronograph gates; high-speed camera with equivalent frame rate and timecode; force and torque vectors; momentum and energy ledger panels; graph anything (uPlot) and a lab notebook with CSV export; a margin-to-failure tool that bisects any parameter to the tipping point (generalised from Stability Triangle's whatIf).
- R2: thermal camera showing apparent temperature (emissivity, reflections, sensor noise, white-hot, black-hot, ironbow and inferno palettes, spot, box and line tools); thermocouple probes with history; schlieren and shadowgraph views from the air grid's density gradients.
- R3: flow view with streamlines, smoke wand and tracers; pressure gauges and flow meters.
- R4: multimeter, oscilloscope, gaussmeter, compass, field lines and field slices.
- R5: spectrometer and light meter.
- R6: microphones, spectrogram and sound level meter.
- R7: g-g diagram, telemetry and lap delta.
- R8: stability polygon and zero-moment-point margin.
- R9: photoelastic stress view (available earlier for joints) and modal analyser.
- R10: ghost orbits, Hill spheres, Lagrange points, porkchop plot and mission clocks.
- Futures missions: Monte Carlo fan chart, percentiles, tornado sensitivity and convergence plot (from Ten Thousand Futures).
- Model Ladder selector: choose the fidelity of model used for a prediction.

The honesty layer:

- Model cards reachable from any object or readout through "How is this calculated?".
- Real, Plausible, Exaggerated and Impossible badges on settings and mutators, with a scene badge that rises automatically when a control moves into fiction (Worldline).
- Computed, anchored and estimated tags on numbers.
- The energy ledger with its solver-residual line.
- "Running below real time" and integration-accuracy banners.
- The Lab Book: every validation bench with its latest result, generated from CI output at build time.

## 10. Presentation

### 10.1 Rendering

- three.js WebGPURenderer with TSL. Instance or batch every repeated object: three.js issue #30560 shows many separate draw calls running slower on WebGPU than on WebGL.
- RenderPipeline with multiple render targets; TRAA, bloom, GTAO, SSR, depth of field, motion blur with a shutter in sim time, volumetric lighting. Global illumination from LightProbeGrid at High and SSGI or VXGI (static environments) at Ultra.
- Procedural materials baked on the GPU at load (Mach Cone's approach) to keep downloads small.
- Screen-space fluid rendering for MPM particles. Incandescence and spectral colour come from the physics.
- Photo mode uses three-gpu-pathtracer's WebGPU path tracer with its denoiser.

### 10.2 Quality tiers

Ultra (M4 Max), High, Medium and the WebGL2 fallback. Selection is automatic from GPU timing with hysteresis, and the player can override it. The fallback disables the detail layer, because three.js's WebGL2 backend has no storage buffers or atomics, but every mission still plays because the AS runs on the CPU.

### 10.3 Audio

- One AudioWorklet engine hosts all voices.
- Modal synthesis for impacts, scraping and rolling, by material (mode tables, excitation from contact impulse and contact time).
- Minnaert bubbles for splashes; per-source delay lines for arrival delay and Doppler; booms and N-waves; a 50 Hz mains hum in The Power House.
- HRTF for the nearest sources and a cheaper bed for the rest; a mix bus with ducking and a loudness limiter.

### 10.4 Interaction

- Building: a two-click joint tool with a ghost preview, snapping (grid, 15° angles, surface normals) and numeric entry; a transform gizmo; a wiring tool; paint material; inspect anything.
- Undo and redo through a command pattern, kept separate from the simulation timeline.
- Time bar: play, pause, step, a logarithmic speed dial, a scrub bar with event markers, branch and compare.
- Camera: orbit, pan, dolly to the cursor, follow, and a cinematic director that predicts interesting events and slows into them.
- Input: Mac trackpad gestures (a pinch arrives as a wheel event with ctrlKey set), mouse, keyboard and gamepad, all remappable.
- Panels use progressive disclosure.

### 10.5 Accessibility

WCAG 2.2 AA contrast for UI text; everything operable by keyboard; remappable controls; reduced motion honoured (start paused, no camera shake); colour never carries meaning alone (contours, glyphs, hover probes with values); perceptual colour maps (viridis, cividis, inferno, with turbo opt-in only); captions and visual cues for sound events; adjustable text size and game speed.

### 10.6 UK defaults

en-GB copy, °C, metres, kilograms, kPa and bar, mph for road vehicles (km/h and m/s selectable), the 24-hour clock and DD/MM/YYYY dates.

### 10.7 Saving

IndexedDB with versioned schemas and tested migrations. Autosave rotates through three slots and never overwrites the last good save when a write fails. Export and import. The Lab autosaves on change.

## 11. Technology stack

These defaults were checked against the npm registry on 14/10/2026. Pin exact versions. Re-check at the start of every phase (16.1) and adopt a newer major version only through an ADR with every test green.

| Area | Default (version on 14/10/2026) | Notes |
|---|---|---|
| Language | TypeScript 7.0.2 (native compiler), strict | lint tooling may still need the TypeScript 6 API package; confirm in P0 |
| Build | Vite 8.3.4 | Rolldown-based |
| Unit and validation tests | Vitest 5.0.4 | needs Node 22.12 or later; use the current Node LTS |
| Browser tests | @playwright/test 1.64.1 | Chromium with SwiftShader WebGPU flags (13.3) |
| WebGPU in Node | webgpu 0.6.2 (Dawn) | WGSL kernel tests and shader validation |
| Property tests | fast-check 4.10.2 | log seeds, freeze counterexamples as tests |
| Rendering | three 0.186.1 (WebGPURenderer and TSL) | photo mode: three-gpu-pathtracer 0.0.27 |
| Rigid bodies | @dimforge/rapier3d-deterministic-compat 0.21.0 | the only build documented as cross-platform deterministic; snapshots are not portable across Rapier versions |
| GPU kernels | WGSL, plus TSL compute where convenient | TypeGPU 0.12.7 is optional and pre-1.0; ADR first |
| ECS | bitecs 0.4.0 | structure-of-arrays, serialisation |
| UI | React 19 with Zustand, HUD fed at 10 to 20 Hz | an ADR may choose Preact signals or Solid if HUD cost exceeds 1 ms per frame |
| Charts | uplot 1.6.32 | |
| Schemas | zod 4.6.7 | at every boundary: saves, missions, replays, share links |
| Workers | comlink 4.4.2 plus transferables | |
| Capture | mediabunny 1.61.x with WebCodecs | offline re-render from replays |
| Assets | gltf-transform CLI (meshopt, KTX2) | procedural first |
| Lint and boundaries | ESLint (or Biome), dependency-cruiser, custom rules | determinism rules for src/sim |
| Hosting | GitHub Pages through Actions | no SharedArrayBuffer needed; if an ADR needs COOP/COEP headers, move to Cloudflare Pages or Netlify (_headers file) rather than coi-serviceworker |

Watch list for every refresh:

- Box3D (Erin Catto; announced June 2026, alpha, claims cross-platform determinism, no JavaScript bindings yet).
- Dimforge Nexus (Rapier on the GPU; no Safari support yet).
- three.js WebGPURenderer maturity (the manual still calls it experimental) and VXGI.
- GPU rigid-body solvers based on AVBD (three-avbd reports about 10 ms per step for 110,000 bricks on an M4 Max).
- WebGPU float-atomics and 64-bit-atomics proposals; Safari and Firefox WebGPU feature sets.
- New Claude Code features (hooks, skills, subagents, /goal, workflows).

## 12. Quality bar: what "flawless" means

| Area | Gate |
|---|---|
| Correctness | 100% of validation benches within tolerance; 100% of missions pass section 7.6 |
| Determinism | golden replays give identical hashes across three runs, across JavaScript engines (Node, Chromium, WebKit, Firefox), across frame rates of 30, 60, 120 and 144 Hz, and across time scales of 0.01x, 1x and 100x |
| Stability | fuzzing 10,000 random scenes for 10 s each: no NaN or Infinity, no energy blow-up, no tunnelling beyond tolerance; snapshot and restore round trip is identical |
| Runtime hygiene | zero uncaught exceptions and zero console errors across the E2E suite and the soak test |
| Performance, M4 Max (Chrome stable, 1440p internal, Ultra) | p95 frame time at most 8.3 ms in reference scenes and 16.7 ms in the stress scene; AS CPU time at most 300 ms per simulated second at 1x in reference scenes, and no single tick over 8 ms |
| Performance, M1 or M2 class (High) | p95 at most 16.7 ms in reference scenes |
| Performance, WebGL2 fallback | p95 at most 33 ms; every mission playable |
| Load | interactive within 4 s warm and 10 s cold on the M4 Max; within 30 s under SwiftShader in CI (several of Ricky's sims took 30 to 45 s there) |
| Memory | JS heap and live GPU resource counts flat within 5% over a 30-minute soak |
| Input | visible response within two frames of input |
| Recovery | WebGPU device loss recovered without losing state; save corruption impossible by design and tested |
| Accessibility | axe-core clean on the UI; the tutorial can be completed by keyboard alone |
| Usability | time to first fun under 60 s; the qa-player subagent completes the tutorial with no help; Ricky's playtest finds no blocker |

Reference scenes (each phase adds its own): RS1 Workshop 300 (300 bodies, 50 joints); RS2 Foundry Fire (200 thermal bodies, air grid, fire detail); RS3 Harbour Storm (256 x 256 shallow-water grid, 50 floating bodies, MPM detail); RS4 Power House (100 circuit components, 40 magnets, field view); RS5 Lighthouse (200 beams, caustics). The stress scene runs all of them at once.

Detail-layer budgets per tier (P4 measures and an ADR confirms): MPM particles Ultra 250,000, High 64,000, Medium 16,000, WebGL2 none.

## 13. Verification system

### 13.1 Commands

| Command | What it runs | When |
|---|---|---|
| npm run verify:fast | typecheck, lint, unit tests, smoke golden replays (under 90 s) | every Stop hook and before every commit |
| npm run test:validation | all physics benches | CI, and before marking physics features |
| npm run test:golden | full golden replays with hash comparison in Node, and in Chromium, WebKit and Firefox through Playwright | CI |
| npm run test:fuzz | fast-check scene fuzzing (short in CI, long nightly) | CI, nightly |
| npm run test:gpu | WGSL kernels against CPU references in Node through Dawn; WGSL validation | CI |
| npm run missions:verify | section 7.6: changed missions plus a sample on push, everything nightly and at gates, cached by content hash and physicsVersion | CI, nightly, gates |
| npm run test:e2e | Playwright: boot, tutorial, each realm's first mission through the test API, save and load, share-link round trip, device loss, the WebGL2 path, reduced motion, keyboard only, console cleanliness | CI |
| npm run test:e2e:smoke | boot, first interaction, zero console errors | start of every session |
| npm run test:visual | reference-scene pixel readback and screenshots per adapter | CI |
| npm run test:soak | 30 minutes of scripted chaos with heap and GPU resource tracking | nightly and phase gates |
| npm run perf:mac | real-GPU performance on Ricky's Mac through headed Chrome; writes docs/BASELINE.md | phase gates and performance work |
| npm run gate PNN | everything the phase gate needs; writes docs/phases/PNN-report.md (`npm run gate PNN review` writes PNN-review.md instead) | end of phase |

### 13.2 Test API

window.__ps exists only in builds made with VITE_TEST_API=1. Mach Cone shipped 480 developer references in its production page; keep test hooks out of production. The API provides step(n), loadScene, applyInputs, getState, hash, runReplay, setTimeScale and a GPU-crash hook.

### 13.3 WebGPU in CI

Run Chromium with `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`. This combination was verified on 14/10/2026 in a CPU-only Linux container: it gave a SwiftShader adapter, correct pixel readback and correct screenshots. Assert on pixel readback first and screenshots second, with per-adapter baselines. Simulate device loss with the Chrome DevTools Protocol command Browser.crashGpuProcess. Real-GPU checks happen on Ricky's Mac through perf:mac, `claude --chrome` or the Chrome DevTools MCP server.

### 13.4 Continuous integration

GitHub Actions on every push: verify:fast, validation, golden (all four engines), gpu, missions (changed plus sample), e2e (SwiftShader), build and size budget. Nightly: the full mission set, the Daily manifest, long fuzzing, soak and visual tests, plus golden replays on macOS and Windows runners. Deploy main to GitHub Pages after a green run. Test runners log to files with grep-able ERROR lines and keep console output short, so a failing run does not flood your context. If the repository is private, Actions minutes are limited: keep push jobs lean and ask Ricky before anything that would cost money (3.5).

### 13.5 Claude Code configuration

Create this in P0 and keep it current:

- CLAUDE.md under 200 lines: commands, a digest of the rules with links to this file, a file map and gotchas.
- Scoped rules in .claude/rules/ with paths frontmatter: sim.md (src/sim/**, the determinism rules), gpu.md (src/gpu/** and **/*.wgsl), content.md (content/**, mission rules and en-GB).
- Hooks in .claude/settings.json. PostToolUse on Edit and Write runs a fast typecheck for .ts files and WGSL validation for .wgsl files, prints the first 40 error lines and exits 2 on failure. Stop runs verify:fast and blocks once with the tail of the log if it fails; the hook reads stop_hook_active from its input and lets the second stop through, so you can always stop to report or ask Ricky (then follow 3.3 on wip/ branches).
- In P0, confirm against the installed Claude Code version that hooks, .claude/rules, skills, subagents and /goal behave as described here. Where something is missing, use the fallback and record it in an ADR: rules folded into CLAUDE.md, a Stop hook instead of /goal, a subagent prompt file instead of a skill.
- Subagents in .claude/agents/:
  - physics-auditor: checks models against model cards, units, conservation and stability limits.
  - mission-critic: plays missions cold and judges clarity, fun and necessity.
  - qa-player: plays the build through browser automation as a human would, tries to break it and files defects.
  - perf-auditor: traces and budgets through the Chrome DevTools MCP server.
  - gate-reviewer: works in a fresh context and tries to refute a phase report.
  Tell reviewers to flag only gaps that affect correctness or the stated requirements, so they do not push over-engineering.
- Skills in .claude/skills/: run-game, new-mission, new-bench, model-card, phase-gate.
- MCP: Playwright (or the Playwright CLI with its skills, which uses less context) configured with the WebGPU flags, and the Chrome DevTools MCP server for traces, console and heap snapshots.
- For long unattended runs, set a /goal condition the transcript can prove, for example "npm run verify:fast exits 0 and every P03 feature passes", or rely on the Stop hook.

### 13.6 Subagents

Delegate research refreshes, wide code searches, reviews, play-testing, mission criticism and performance analysis. Keep implementation in the main session. Give each subagent a precise brief and ask for evidence back.

## 14. Repository and documents

```
programme/            this pack (read-only for you)
src/sim/              AS: core, dmath, rng, scheduler, ledger, domains/*, kits/*, missions/
src/gpu/              DS kernels (WGSL) and their CPU reference implementations
src/render/           scene, materials, post-processing, instrument visuals, tiers
src/audio/            AudioWorklet engine, modal synthesis, propagation
src/ui/               HUD, editor, panels, time bar, menus
src/app/              bootstrap, workers, saves, settings, routing
src/content/          schemas
content/              materials, missions, scenes, codex, templates, law cards
tools/                headless CLI: run replays, verify missions, generate dailies, benchmarks
tests/                unit, validation, golden, fuzz, gpu, e2e, visual, soak
docs/                 PROGRESS.md, features.json, DEFECTS.md, LEARNINGS.md, IDEAS.md,
                      PHYSICS-CHANGELOG.md, BASELINE.md, adr/, model-cards/, research/,
                      phases/, playtests/, architecture/
```

## 15. Phase plan and gates

| Phase | Name | What Ricky can play at the end |
|---|---|---|
| P0 | Foundations | A cube falls in WebGPU and replays bit for bit; CI green; all tooling live |
| P1 | The Lab: mechanics | A mechanics sandbox with building, time control and instruments |
| P2 | First Principles: The Workshop | Mission framework, 12 Workshop missions, tutorial, Daily Experiment v1, codex v1 |
| P3 | Heat and fire: The Foundry | Thermal, air and combustion, thermal camera, schlieren, 8 missions (the last 2 need liquids and arrive in P4) |
| P4 | Water and sand: The Harbour | Shallow water, plumbing, granular matter, boiling, MPM detail, 10 Harbour missions and the last 2 Foundry missions |
| P5 | Electricity and magnetism: The Power House | Circuits, fields, induction, field views, 10 missions |
| P6 | Light: The Lighthouse | Optics, solar heating, photocells, caustics, photo mode, 10 missions |
| P7 | Replayability | Generator v2, Daily and Weekly, Forensics Bureau, Chain Reaction, Constants Run, Futures instruments, Evolution Bench, sharing, clips |
| P8 | The Proving Ground | Projectiles, sound, booms and blast, 8 missions, the seven-domain Chain Reaction |
| P9 | Engineering realms | Test Track, Warehouse and Fault Line, 6 missions each |
| P10 | Launch, Orbit and Other Worlds | Rockets, orbits, entry, planetary presets, 18 missions and the last Forensics case |
| P11 | Release hardening, v1.0 | Performance, accessibility, cross-browser, polish, launch |
| P12 | Frontier (optional) | The Edge, global leaderboards, AI lab assistant, WebXR, mod API |

Phase IDs are written P0 to P12 in prose; file names, feature IDs and commands use two digits (P00 to P12, for example `npm run gate P03`).

Every phase ends with a gate (section 3.4). Phases are vertical slices: the game is playable and deployed at the end of each one. A phase may take several sessions; never start the next phase until the gate has closed.

## 16. Keeping the programme current

### 16.1 Research refresh (start of every phase)

Check the versions in section 11 and the watch list against npm, GitHub releases and official documentation. Look for new techniques, libraries, browser features and notable physics games since the last refresh. Write docs/research/YYYY-MM-DD-refresh.md with sources. Propose changes as ADRs. Never adopt a change that breaks determinism or a gate.

### 16.2 Learning loop

docs/LEARNINGS.md (what surprised us), docs/IDEAS.md (ideas outside the current scope), phase reports and playtest notes feed the next version of this programme. Ricky runs programme/UPGRADE-PROMPT.md between phases or when new technology lands.

### 16.3 Programme versioning

MAJOR for pillars or architecture, MINOR for new phases, sections or research, PATCH for clarifications. programme/CHANGELOG.md records every change.

---

# Appendices

## Appendix A - docs/features.json

```json
{
  "programme": "phase-space",
  "programmeVersion": "1.0.0",
  "features": [
    {
      "id": "P01-012",
      "phase": "P01",
      "priority": 1,
      "category": "mechanics",
      "description": "Hinge joints break above their torque limit and log a fracture event with its energy",
      "verifier": "vitest tests/validation/mechanics/breakable-joint.test.ts",
      "steps": [
        "Load scene lab/breakable-hinge",
        "Apply a torque ramp",
        "Assert the break happens within 2% of the limit and the ledger books the fracture energy"
      ],
      "passes": false,
      "evidence": null
    }
  ]
}
```

Rule 2.6 applies: you may set passes and evidence and append entries. Any other change, to any entry, needs Ricky's written approval, recorded with its date in PROGRESS.md. Seed each phase's entries in that phase's first session, not earlier. Anthropic found that agents are less likely to rewrite a JSON feature list inappropriately than a Markdown one, which is why this list is JSON.

## Appendix B - mission example

```json
{
  "id": "R3-05",
  "slug": "plimsoll-line",
  "version": 1,
  "realm": "R3",
  "title": "Plimsoll Line",
  "briefing": "Load the barge with sand at the sea quay. It must sail upriver and moor at the freshwater wharf with at least 20 cm of freeboard, carrying as much as it safely can. There is time for one loading and one sailing.",
  "principles": ["Archimedes' principle", "density of fresh and sea water", "freeboard"],
  "mode": "One-Shot",
  "difficulty": 3,
  "estimatedMinutes": 8,
  "scene": {
    "seed": 5317,
    "world": "harbour-estuary",
    "settings": { "g": 9.81 },
    "entities": ["barge-20x6x2-steel", "sand-hopper", "quay-sea", "wharf-river"],
    "allowedTools": ["tape-measure", "hydrometer", "load-cell", "notebook"],
    "timeLimitS": 900
  },
  "parameters": [{ "name": "cargoTonnes", "min": 0, "max": 250, "step": 0.5 }],
  "randomised": [
    { "name": "bargeEmptyMassKg", "min": 36000, "max": 44000 },
    { "name": "seaDensity", "min": 1025, "max": 1028 },
    { "name": "riverDensity", "min": 998, "max": 1002 }
  ],
  "derived": [
    { "name": "maxSafeCargo", "expr": "riverDensity * 120 * (2.0 - 0.20) - bargeEmptyMassKg", "unit": "kg" }
  ],
  "attempts": 1,
  "runCost": 0,
  "objective": "(moored(\"barge\", \"wharf-river\") && freeboard(\"barge\") >= 0.20) for 10 s && cargo(\"barge\") >= 0.95 * maxSafeCargo",
  "failConditions": [
    "swamped(\"barge\")",
    "moored(\"barge\", \"wharf-river\") && freeboard(\"barge\") < 0.20"
  ],
  "prediction": { "type": "number", "label": "Draft at the river wharf", "unit": "m", "tolerance": 0.01 },
  "metrics": ["cargo", "freeboardMargin", "predictionError"],
  "stars": {
    "objective": "objective",
    "efficiency": "cargo(\"barge\") >= 0.985 * maxSafeCargo",
    "insight": "predictionError <= 0.01 && hintsUsed <= 2"
  },
  "hints": [
    "A floating body displaces its own weight of water.",
    "Measure both waters with the hydrometer and weigh the empty barge on the load cell.",
    "For a box hull, draft d = m / (rho x A).",
    "A 10 x 4 m pontoon of 30 t floats 0.75 m deep in fresh water and 0.73 m deep in sea water.",
    "Show the reference solution (forfeits the insight star)."
  ],
  "debrief": "Your barge carried {cargo_t} t and drew {draft_river} m at the wharf against {draft_sea} m at sea. The river was {rho_river} kg/m^3 against {rho_sea} at sea, so the same load sat {delta_cm} cm deeper upriver. Real ships carry separate load lines for fresh and sea water for exactly this reason: the Plimsoll mark.",
  "realWorld": { "text": "Load lines and the Plimsoll mark", "source": "International Convention on Load Lines, 1966" },
  "modelCards": ["fluids-buoyancy-exact-volume", "fluids-shallow-water"],
  "solutions": {
    "reference": [
      { "approach": "Read the hydrometer at the wharf and the load cell; load 0.98 x (rho_river x A x (H - 0.20) - m_empty), rounded down to the 0.5 t step", "solver": "solvers/R3-05.ref.ts" },
      { "approach": "As above with a factor of 0.99 (earns star 2)", "solver": "solvers/R3-05.ref-star2.ts" }
    ],
    "traps": [
      { "misconception": "Size the load by the water you are floating in at the quay: the reference solver with rho_sea in place of rho_river", "solver": "solvers/R3-05.trap.ts" }
    ]
  },
  "necessity": {
    "bot": "uniform-parameter",
    "attempts": 1,
    "maxSuccessRate": 0.05,
    "separating": { "quantity": "freeboard at the wharf", "benches": ["F2"] }
  }
}
```

The numbers, for the nominal attempt (empty barge 40 t, river 1,000 kg/m^3, sea 1,025 kg/m^3, hull 20 x 6 m, depth 2.0 m), and across the randomised range:

- maxSafeCargo = 1,000 x 120 x 1.80 - 40,000 = 176 t. The objective band is 167.2 to 176 t, so a uniform guess over 0 to 250 t in 0.5 t steps succeeds about 3.6% of the time (check 4).
- Solvers read only what the allowed tools show (7.1) and round down to the 0.5 t step.
- The reference loads 172.0 t and moors with 0.233 m of freeboard, clearing the 0.20 m threshold by 3.3 cm (at least 2.9 cm across the range). The combined tolerance is bench F2's 0.2% of a 1.8 m draft, 0.36 cm (check 9).
- The star 2 reference loads 174.0 t (0.217 m of freeboard; at least 1.5 cm of margin across the range) and always meets the 98.5% threshold. The star 2 band spans 2.2 cm of freeboard, more than twice 0.36 cm.
- The trap is the same solver with the sea density: it loads 177.5 t and moors with 0.188 m of freeboard. Across the range it overloads by 1.1 to 2.4 t and misses the threshold by at least 0.9 cm, two and a half times the combined tolerance. The freeboard separating reference from trap is at least 3.8 cm, more than five times the combined tolerance.
- Randomised mass and densities change maxSafeCargo on every attempt, so a remembered number does not carry over.

## Appendix C - model card template (docs/model-cards/<id>.md)

```
# Model card: <name> (<domain>)
Reality badge: Real | Plausible | Exaggerated | Impossible
Equations: ...
Assumptions and valid range: ...
Numerical method and timestep: ...
Couplings in and out: ...
Data sources: ...
Validation: bench IDs and latest results (inserted by CI), date of last run
Known limits and what is not modelled: ...
Player-facing summary (at most 60 words, en-GB): ...
```

## Appendix D - phase report template (docs/phases/PNN-report.md)

```
# PNN report - <name>
Date (DD/MM/YYYY), programme version, physics version, commit
Gate table: item | result | evidence (command and summary line, hash, screenshot path)
Benches: id | expected | measured | error | pass
Missions: id | references pass | traps fail | bot success rate | ledger | pass
Performance: scene | tier | frame p50 | p95 | p99 | AS ms per simulated second | worst tick | machine
Defects opened and closed; waivers requested (with reason)
Gate-reviewer findings and how each was resolved
What changed in LEARNINGS and IDEAS
Playtest checklist for Ricky
```

## Appendix E - ADR template (docs/adr/NNNN-title.md)

```
# NNNN Title
Status: proposed | accepted | superseded by NNNN
Context: the problem and the forces at play, with numbers
Options considered: at least two, each with evidence
Decision: what and why
Consequences: what gets easier, what gets harder, what to watch
Verification: the test or measurement that shows the decision works
```

## Appendix F - reference set to beat (from research on 14/10/2026)

| Title | What it does best | Its lesson for us |
|---|---|---|
| Universe Sandbox | planet-scale coupled what-ifs; heat, composition and gravity together | players complain it has no goals: we pair the sandbox with missions |
| The Powder Toy | heat, pressure, air, electricity and gravity coupled on one grid | performance and learning curve; we add guidance and budgets |
| Oxygen Not Included | coupled heat, gas, liquid and power in real-ish units | hand-tuned heat multipliers break conservation and get farmed; our ledger forbids this |
| Noita | every pixel simulated; generated levels kept designable with Wang tiles | lack of guidance is the top complaint; we explain discoveries |
| Teardown | destruction as planning under a timer | hardware demands; we budget and tier |
| BeamNG.drive | soft-body vehicles where damage is the physics | performance is named in 41% of negative reviews |
| Besiege | readable machine building; automatic slow motion under heavy load | repetition and building friction |
| Kerbal Space Program | real orbital mechanics with a steep but rewarding curve | KSP2 failed on unstable physics: stable core first |
| Poly Bridge 3 | budget-limited engineering, weekly challenges | difficulty spikes |
| Opus Magnum | histograms of cost, cycles and area; community bot re-simulates solutions | metrics need exact measurement points |
| Stormworks | fluids, electrics and logic in vehicles | a 2023 physics change broke player creations: version the physics |
| PhET and Physics Playground | guidance built into controls; stealth assessment of understanding | under-used controls need a targeted nudge |
| Falstad CircuitJS | an entire circuit shareable in a URL | share links matter |
| Sandspiel | 70,000+ shared creations with no accounts | sharing without friction |
| WebGPU-Ocean | about 100,000 MLS-MPM particles in a browser on integrated graphics | the browser can do real GPU fluids |
| three-avbd | 110,000-brick rigid-body scenes at about 10 ms per step on an M4 Max | watch for GPU rigid bodies |
| Ricky's Mach Cone, Worldline, Orrery, Track Day, Stability Triangle | depth, honesty, real data, cinematic time, self-tests | see programme/reference/LEARNINGS.md |

