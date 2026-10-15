# Learnings from Ricky's simulators

Reviewed on 14/10/2026: 31 published simulators built between August and October 2026, by static code review (four reviewers), a headless smoke test of every page (Chromium with a SwiftShader software GPU), and three runs of Mach Cone Phase 1's own test suites. A personal admin dashboard in the same gallery was excluded. Use this file as evidence for design decisions; MASTER.md turns it into rules.

## 1. The portfolio

| Simulator | What it is | Built with | Most notable |
|---|---|---|---|
| Mach Cone (Phase 1) | 3D ballistics range, 28 guns, 22 missions, deep exterior and terminal ballistics, acoustics | three 0.186.1, Rapier 0.21, 50 source files joined by build.js, 73,500 lines | golden hash shared by Node and page; trust suite; REAL/PLAUSIBLE/IMPOSSIBLE toggles |
| Worldline | five relativity chapters, 31 predict-first missions | three 0.186.1, 1.9 MB code plus 6.5 MB textures | reality badges, depth levels, mission self-tests |
| Orrery | solar system from JPL elements; Explore, Expeditions, Missions, Sandbox | custom WebGL2 | Yoshida integrator, Lambert solver, energy-drift badge, plan-then-fly missions |
| Star Forge | a star's life with binaries and remnants | three 0.160 | Hurley-Pols-Tout tracks, model card, scrub any age |
| Gravitas | 2D gravity toy with six missions | canvas2d with a WebGL background | Paczynski-Wiita near black holes, Roche shattering |
| Gravity Well | 2D N-body throw-a-planet sandbox | raw WebGL2 | 60,000 test stars, figure-eight preset |
| Newton's Exception | superhero city with one variable: your own strength | three 0.160, cannon-es | energy in joules drives effects, audio and damage |
| Worldsheet | scrolling essay on string theory | canvas2d | measured, derived and conjecture colour key |
| Crumple Lab | frontal crash lab with a 3D crumple replay | three r128 | calibrated lumped crash model; occupant restraint model; verdict sentences |
| Track Day | race engineering on fictional UK circuits | three 0.160, worker | Pacejka tyres, minimum-time racing line, A against B telemetry |
| Shake Table | up to three buildings in an earthquake | three 0.160 | Newmark with Newton-Raphson, SELF_CHECKS, presets as lessons |
| Stability Triangle | forklift stability, including sideloaders | three 0.180, Rapier | ISO 22915 tilt tests, missions with safe-practice penalties, handoff to Rapier |
| Demolition Reconstructor | impact lab with air cannon and targets | three, Rapier | fixed 1/120 s with accumulator and interpolation |
| Crossplane | dyno cell for a 6.2 litre cross-plane V8 | three 0.180, CSG | per-cylinder cycle, knock, failure stories, AudioWorklet engine sound |
| Bernoulli's Garage | GPU wind tunnel with ten fluids | three, GPU Navier-Stokes | disclosed calibration to published drag coefficients |
| M6 Keep Left | two driver cultures on the same motorway | canvas2d | IIDM and MOBIL with Highway Code rules; common random numbers |
| Genetic Garage | evolve 2D cars | planck.js | genetic algorithm, deterministic per seed |
| Hertz Hall | materials impact lab with high-speed camera | three 0.180, Rapier 0.21 | Hertz contact, Voronoi fracture, modal audio, recorder with branching |
| Thermal Camera Lab | paint real materials, watch through a thermal camera | canvas2d | stability-derived dt, convection by stable fluids, OSD and probes |
| Heat Flow Bench | two boxes reaching equilibrium | canvas2d | live-numbers equation |
| Nozzle Lab | drag a rocket nozzle's throat and bell | canvas2d | isentropic flow; Merlin 1D within about 6% |
| Ballistica | cinematic range, solve then film | hand-written canvas2d 3D | G1/G7 drag, Miller stability, 13 world presets |
| Terminal Ballistics Lab | projectile into layered targets | custom WebGL2 | layer editor, same-seed ghost |
| Newton's Playground | 2D lab where the laws are the sliders | canvas2d | created-energy audit, reactive narrator |
| Ten Thousand Futures | Monte Carlo planner | canvas2d | fan chart, percentiles, tornado, convergence plot |
| Turing Garden | reaction-diffusion patterns | WebGL2 | f-k parameter pad |
| Primordial Garden | artificial life | canvas2d | gene and brain inspector, chronicle of lineages |
| Corpus Living Anatomy | the body over time | three | life strip with click-to-rewind |
| Cooperate or Defect | game theory tournaments | canvas2d | runChecks against published results |

## 2. What Ricky values

- Honesty about models. Mach Cone badges every toggle REAL, PLAUSIBLE or IMPOSSIBLE; Worldline uses Real, GR-allowed, Speculative and Fiction with a scene badge that rises automatically; Worldsheet colours text measured, derived or conjecture; Thermal Camera Lab has "How honest is this?"; Crumple Lab has "Not modelled"; Bernoulli's Garage shows "published 0.34 | form + skin".
- Real data with sources: JPL elements, CelesTrak GPS orbits, ISO 22915, NCAP and FMVSS, Highway Code rules and DfT speed data, GM LT1 engine data, Lapua Doppler drag, 88 materials each with a source field.
- Many variables and absurd worlds: Ballistica's Moon, Jupiter, syrup air and glass world; Mach Cone's 45 impossible toggles; Newton's Exception's single variable; Newton's Playground's laws as sliders.
- Time as the main verb, described in film language: log time dials down to a millionth, high-speed camera timecodes, bullet time keyed to physics events, flight recorders, charts that seek the replay.
- Comparison as the main loop: three buildings side by side, twin motorways fed identical vehicles, A against B telemetry corner by corner, same-seed ghosts.
- Instruments: OSDs, probes, scan lines, isotherms, chronographs, dope cards, X-ray and Schlieren views, g-g diagrams, HR and Minkowski diagrams, tornado and convergence plots.
- Verdicts in plain sentences that quote numbers: Crumple Lab's verdict(), Track Day's narration, Newton's Exception's scenario results.
- Proof that it works: self-tests in Mach Cone, Shake Table, Track Day, Stability Triangle and Cooperate or Defect; Node tests; golden hashes.
- UK framing, en-GB copy, keyboard maps, respect for reduced motion.
- Something he can share: Mach Cone has no human or animal targets; Ballistica and Terminal Ballistics Lab, with real firearms, are harder to share.

## 3. Process lessons

- The later sims were real projects disguised as single files: multi-file sources joined by build.js, SPEC.md and ARCHITECTURE.md contracts with numbered sections, research notes with a "canonical values win" document, defect ledgers cited in code, module owners and Node tests. A repository formalises a habit Ricky already has.
- Mach Cone's programme went measure first, then trust, then fidelity and content. Phase 1 ("Trust") added about 7,850 lines across 25 of 47 files (determinism, a snapshot ring, an operation log, a watchdog and a trust suite) while the physics stayed unchanged apart from seeding. Retrofitting trust is expensive; build it in from the first commit.
- Two generations of test harness lived side by side. On 14/10/2026 the newer, anchored resumeAnywhere suite passed 6 of 6 with zero error, and the golden hash matched Node. The older rewind tests failed: runs were not reset between trials (noise floors of 1,098 mm and 7.9 m), and one "passed" with nothing tested because debris from the previous run was still in the scene. simSelfTest passed 13 of 14 and replayTests reported pass: false. Lessons: hermetic resets, one result schema, a test that tests nothing must fail, and performance limits kept out of correctness suites (a minigun check failed at 12.10 ms against a 12 ms limit inside a correctness suite).
- Under a software GPU, Mach Cone took about 44 s to boot against a 45 s watchdog, and eight of the heavier sims did not finish loading or answer a frame probe within the smoke test's window. If the game cannot boot quickly on a software adapter, CI cannot test it.

## 4. Failure modes to design out

| Failure | Where it was seen | Prevention (MASTER) |
|---|---|---|
| Stepping tied to frame rate | Gravity Well steps once per frame (twice as fast at 120 Hz); Genetic Garage steps Math.round(speed x dt x 60) per frame with no accumulator, so at 1x on a 144 Hz display it all but stalls; Turing Garden's speed follows the refresh rate; Track Day drops the remainder each frame | 5.3 fixed tick; golden tests at 30, 60, 120 and 144 Hz |
| Slow motion that changes the physics | Hertz Hall sets dt from the time scale; Gravitas stretches the step up to five times at 10x warp | 2.8, 5.3 |
| Time lost silently | Hertz Hall drops time beyond 40 steps per frame without saying so (Mach Cone reports it) | "running below real time" |
| Math.random in physics | Hertz Hall fracture, Thermal Camera noise, Turing Garden | 5.4 seeded streams and lint |
| Predictors that disagree with the sim | Gravity Well (different softening and step, ignores merges, yet promises "exactly"); Gravitas (planets frozen in the gravity-assist preview, the very effect the mission teaches); Orrery (planets frozen in transfer previews) | 6.8 the predictor forks the world and uses the same integrator |
| Trust instruments that are wrong | Orrery's drift badge ignores the force-law, GR and drag modes; Worldsheet's "Difference" readout can never be non-zero | 2.5; a check that cannot fail is a defect |
| Copied physics drifting apart | spin drift in Terminal Ballistics is twice Ballistica's; two Coriolis models; two G1 tables | 2.4 one source of truth |
| Explicit stiff terms overshooting | Thermal Camera Lab's radiation step overshoots and clamps vacuum cells to 1 K | 6.2 implicit, linearised radiation |
| Instruments that show truth, not measurement | Thermal Camera Lab shows true temperature, so emissivity never fools it | 9 apparent temperature |
| Tools whose strength depends on input rate | Thermal Camera's torch adds 90 K per pointer event and is missing from "power in" | tools apply power over sim time and the ledger books it |
| Runtime CDNs and version sprawl | three r128, 0.160, 0.180 and 0.186; Rapier 0.14 and 0.21; Crossplane's CSG library loaded as raw source modules stalls start-up for 12 s; Hertz Hall fails offline | 2.10 pinned and bundled |
| Monolith pages and defensive coupling | Mach Cone: 5.3 MB, 192 "typeof ... === 'function'" guards, 337 silent catches; Worldline: 8.6 MB, 6.5 MB of it base64 textures | module boundaries, loud failures in development, assets kept separate |
| Missing asset with no fallback | Corpus Living Anatomy: a 404 then a JSON parse error | asset manifest checked in CI; graceful fallback |
| Developer hooks shipped | 480 MC.dev references in Mach Cone's page | 13.2 test API behind a build flag |
| Slider overload | 30 to 43 sliders on one panel (Shake Table has 43) | 4.6 progressive disclosure |
| Stale copy | Mach Cone's hint says "23 guns"; the catalogue has 28 | counts in copy come from data |
| No goals | only Mach Cone, Worldline, Orrery, Gravitas and Stability Triangle have missions; the rest have "things to try" with checkable predictions (Heat Flow Bench's 71 °C, Hertz Hall's rebound of e^2 h) | those lists become missions |
| Hard to share | real firearms catalogues in Ballistica and Terminal Ballistics Lab | 2.12 |

## 5. Patterns to keep

| Pattern | Origin | Where it lives now |
|---|---|---|
| Pure physics cores: no DOM, SI units, Node tests | Mach Cone PHYS, CrashLab, Track Day, Stability Triangle, Crossplane, Star Forge | MASTER 5.9 |
| Golden hash shared by Node and the page | Mach Cone (1,000 seeded shots, hash 91d032447d9afa1b) | 5.4 golden replays |
| Fixed grid of sim time, exact event chunking, interpolation, drop not stretch | Mach Cone, Shake Table, Demolition Reconstructor | 5.3 |
| RNG seeded by cause; the build fails on Math.random | Mach Cone | 5.4 |
| One table drives controls, tooltips, presets, missions and tests | Mach Cone's MC.PARAMS | materials database and schemas |
| Analytic time where a closed form exists, so rewind costs nothing | Star Forge tracks, Worldline closed forms, Mach Cone's analytic particles | 5.3 continuous-time models |
| Exact deltas for tiny clock offsets (1 + 3.6e-17 equals 1 in a double) | Worldline | numerical guidance in model cards |
| Handoff from an analytic model to rigid bodies at the point of no return | Stability Triangle, Crumple Lab | 5.8 |
| Common random numbers for fair comparisons | M6 Keep Left, Ten Thousand Futures | P7 Futures |
| Predict first, three tiered stars, mission self-test (goal not met at setup, scripted solve, stars reported) | Worldline | 7.4 and 7.6 |
| Plan in the simple model, fly in the full one | Orrery (Lambert, then N-body) | Model Ladder, P10 |
| Penalties that encode correct practice | Stability Triangle's scoreMission | Control mode |
| Energy as the event currency for effects, audio and damage | Newton's Exception | 4.7 |
| Sound derived from physics | Hertz Hall modal audio, Crossplane's AudioWorklet engine, Mach Cone's propagation delay and N-waves, Orrery's sonification | 10.3 |
| Achieved speed shown next to requested speed | Thermal Camera Lab | 5.3 |
| Quality tiers measured on the M4 Max | Mach Cone at 4K: balanced 4.7 ms, high 10.6 ms, cinematic 15.3 ms; Worldline's GPU-timed dynamic resolution with a Metal-safe fallback | 10.2 |
| Start paused under reduced motion | Gravity Well, Newton's Playground | 10.5 |
| Seed codes for sharing | Stability Triangle (ST-XXXXXXX) | 8 sharing |

## 6. Idea harvest

| Idea | From | Lands in |
|---|---|---|
| A thermal camera that shows apparent temperature, with emissivity, reflections and noise | Thermal Camera Lab, and Ricky's own camera | P3 WP3.4, R2-02 |
| Schlieren computed from real density gradients (Terminal Ballistics' "Schlieren" was only a colour grade) | Mach Cone, Terminal Ballistics Lab | P3 WP3.5, P8 |
| Futures missions: pass in 95% of seeded runs, with fan chart, percentiles, tornado and convergence | Ten Thousand Futures | Futures mode, P7 |
| Margin-to-failure bisection and sweeps to tipping points | Stability Triangle's whatIf, Ballistica's solvers | R1 instrument |
| Predict then run, scored on error | Worldline, Mach Cone's predictor cross-checks | Predict mode |
| Created-energy alarm | Newton's Playground | 5.7 ledger |
| Layered barrier design for non-weapon cases (space debris, hail) | Terminal Ballistics Lab's layer editor | R6-06, R6-07 |
| Identify a material by its impact sound | Hertz Hall | codex and Investigate missions |
| Best average thrust from sea level to altitude | Nozzle Lab | R10-01 |
| Recorder-graded missions shared as seed plus inputs | Hertz Hall, Mach Cone | 5.5 replays |
| Model Ladder: score the cheapest model that is accurate enough | Orrery and Gravitas review | R10-09, P10 |
| Porkchop plot as an instrument (Orrery computes one but never shows it) | Orrery | P10 WP10.3 |
| A fan of slightly perturbed predictions for chaotic systems | Gravity Well review | Futures instruments |
| Precession measured live, not captioned | Orrery | R10-09 |
| A clock strip of proper times | Worldline | P12 F1 |
| One-variable powers with live consequences | Newton's Exception | Constants Run Law cards |
| Planetary defence with DART's momentum factor | Orrery | R10-06 |
| Leaving the track becomes a crash replay with HIC | Track Day plus Crumple Lab | P9 |
| Forensic reconstruction with a hidden truth | Crumple Lab, Track Day reviews | Forensics Bureau |
| Hospital under a Kobe-like record, detuning, tuned dampers | Shake Table | R9 |
| Truck certification and par-timed jobs | Stability Triangle | R8 |
| Branch at any moment and compare ghosts | Hertz Hall, Terminal Ballistics Lab | P1 WP1.4 |
| Range by the crack-to-bang delay | Mach Cone | R6-03, R6-04 |
| Absurd worlds with honesty badges | Ballistica, Mach Cone | Law cards, R11 |
| A director that slows into the next interesting event | Mach Cone | 10.4 |
| Daily seed with version-locked bests | Mach Cone | P2, P7 |
| Depth levels: Explorer, Student, Physicist | Worldline | 4.3 |
| "Things to try" lists | Heat Flow Bench, Thermal Camera Lab, Hertz Hall | missions |
| Evolution bench with lineages | Genetic Garage, Primordial Garden | P7 WP7.6 |
| Motorway control room against a demand ramp | M6 Keep Left | docs/IDEAS.md (outside v1.0) |
| Engine dyno failure lab | Crossplane | docs/IDEAS.md (frontier pack) |
| Wind tunnel Reynolds matching | Bernoulli's Garage | docs/IDEAS.md (needs CFD in the AS) |

## 7. Smoke test (14/10/2026)

Every page was served locally and loaded in headless Chromium with a SwiftShader software GPU, then watched for console errors, page errors and failed requests, and probed for frames. Frame rates under SwiftShader say nothing about the M4 Max; the useful signals are errors and whether the page boots at all.

- 30 of 31 pages loaded with no console errors, page errors or failed requests.
- Corpus Living Anatomy requested assets/corpus-parts.json, got a 404, then threw a JSON parse error with no fallback.
- Eight heavier pages did not answer the frame probe or finish loading within the window: both Mach Cone builds, Worldline, Stability Triangle, Crossplane, Bernoulli's Garage, Demolition Reconstructor and Hertz Hall. Two more (Track Day and Ballistica) loaded but drew no frames during the probe. Mach Cone's own boot under SwiftShader took about 44 s.
