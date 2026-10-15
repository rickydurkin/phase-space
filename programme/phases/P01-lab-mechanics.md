# P01 - The Lab: mechanics

Programme v1.0.0. Prerequisite: P00 gate closed. Typical length: 4 to 8 sessions.

## Goal

A mechanics sandbox that is a joy on its own: build contraptions from parts and real materials, run them, slow them down, scrub, branch and compare timelines, and measure everything. Visual quality at Ultra should already make Ricky stop and look. Every later domain plugs into what this phase builds: materials, parts, tools, time, instruments and the ledger.

## What Ricky can do at the end

Build a trebuchet or a domino run from parts in a few minutes, watch it at 1/30 speed through the high-speed camera, branch the timeline, change the counterweight and compare the two throws as ghosts, then save it and send himself a share link.

## Read first

- MASTER Part A; sections 4.6, 4.7, 5, 6.1, 9, 10 and 12.
- LEARNINGS.md sections 2, 4, 5 and 6 (taste, failure modes, patterns, idea harvest).
- MISSION-CATALOGUE.md, R1 and the codex seed list (the Lab presets should set up those phenomena).

## Plan (first session)

Write docs/phases/P01-plan.md. Seed docs/features.json with the work packages below, one verifiable feature per entry, prioritised so a playable Lab exists early and grows.

## Work packages

### WP1.1 Materials database v1

content/materials/*.json with a Zod schema. Thirty materials to start: structural steel, stainless steel, cast iron, aluminium 6061, copper, brass, lead, tungsten, titanium, gold, oak, pine, cork, rubber, PTFE, acrylic, polycarbonate, soda-lime glass, borosilicate glass, ice, concrete, brick, granite, carbon fibre composite, cardboard, paper, felt, polyurethane foam, NdFeB magnet, ferrite magnet.

Every material carries properties for every domain now, even those simulated later, so no material needs revisiting: density; elastic modulus, Poisson's ratio, yield and ultimate strength, brittleness and fracture energy; friction defaults and restitution; specific heat, thermal conductivity, emissivity, expansion coefficient, melting point, latent heats and boiling point where relevant; ignition temperature, heat of combustion and burn rate for fuels; resistivity and its temperature coefficient; magnetic class, relative permeability, saturation, remanence and Curie temperature; refractive index with Cauchy or Sellmeier coefficients and absorption; speed of sound and loss factor, plus modal ratios for audio; PBR appearance. Each property has a source or an "est." flag. Friction and restitution pairs use a pair table with sensible defaults.

### WP1.2 Parts and kits

Primitives (box, sphere, cylinder, capsule, wedge, plate, beam), wheels and axles, hinges, sliders, ball joints, springs and dampers, ropes, motors (torque-speed curve), gears and belts, pulleys, weights, ramps, containers, a spring launcher and a counterweight arm for trebuchets. Each part has a mass, a material and an inspector panel.

### WP1.3 Building tools

Place from a palette; transform gizmo with snapping (grid, 15° angles, surface normals) and numeric entry; two-click joints with a ghost preview, limits and break strength; weld, duplicate, group, mirror; paint material; delete; inspect. Undo and redo through the command pattern, separate from the sim timeline. Building works while paused and while running.

### WP1.4 Time

The time bar: play, pause, single step, logarithmic speed dial from 1/1,000x to 100x, scrub with event markers (impacts, fractures, joint breaks), branch at any tick, and compare two or three timelines as ghosts with a difference readout (positions, energies, times of events). The high-speed camera mode shows equivalent frame rate and a timecode. Slow motion changes ticks per frame only; when one tick spans more than 1/30 s on screen, show the "interpolated" badge (MASTER 5.3). Lab scenes built for slow-motion study (impacts, the domino run) use the 480 or 960 Hz tick that the P0 spike showed they can afford. At 960 Hz every rendered frame shows new physics down to about 1/30x; slower than that, the badge appears and the high-speed camera relies on the continuous-time models. Auto slow motion when a large energy event is predicted or when the AS falls behind (Besiege's safety valve), with the reason shown.

### WP1.5 Instruments (R1 set)

Tape measure and protractor, chronograph gates, force and torque vectors, momentum and energy ledger panels with the solver-residual line, graph anything with uPlot, a lab notebook with CSV export, and the margin-to-failure tool (bisect any parameter to the point where a joint breaks, a stack topples or a body leaves a zone). All read from the observation bus.

### WP1.6 Aerodynamics and fracture

Per-body drag with orientation-dependent area, lift for plates, Magnus and spin decay for spheres. Gyroscopic torque enabled (bench M8). The optional rotating reference frame (Coriolis and centrifugal forces) for Coriolis and Foucault codex entries. Breakable joints with limits derived from material and section. Brittle parts pre-fractured into seeded Voronoi cells bonded by breakable joints; fracture energy booked in the ledger.

### WP1.7 Sound v1

The AudioWorklet engine, modal synthesis of impacts by material (frequencies scale with size, damping from the loss factor, amplitude from the contact impulse, brightness from contact time) and a simple room reverb. Sounds are triggered from AS events at the right view time, so slow motion and scrubbing stay in sync.

### WP1.8 Saves and sharing v1

IndexedDB saves with versioned schemas and a migration test; autosave rotation; export and import; share links carrying the scene in the URL fragment (deflate-raw and base64url, with game and physics versions).

### WP1.9 Lab presets

Eight scenes that set up phenomena from the codex seed list: Newton's cradle (with 1 mm gaps between the balls, because sequential-impulse solvers cannot resolve a chain of simultaneous contacts), a domino run with Whitehead amplification (each domino about 1.5 times the last), a trebuchet, a pendulum wave, a rolling race (hoop, disc and sphere), a spinning T-handle in zero gravity (Dzhanibekov effect), a stack-and-topple tower, and a catapult range.

### WP1.10 Presentation

- Quality tiers v1 with automatic selection.
- The Workshop environment as the Lab's default room, lit and textured to Ultra standard.
- Trackpad, mouse, keyboard and gamepad controls, all remappable.
- Depth setting (Explorer, Student, Physicist) affecting labels and panels.
- The Lab Book page listing benches M1 to M12 with their latest CI results.
- Model cards for rigid bodies, joints, aerodynamics and fracture.

### WP1.11 Soft bodies spike

Test Rapier 0.21 soft bodies (rope, cloth, jelly) for determinism (hashes across the four JavaScript engines) and snapshot inclusion. Record the result in an ADR. Adopt them only if both hold.

## Benches

M1 to M12 (MASTER 6.1).

## Gate

- [ ] Benches M1 to M12 pass.
- [ ] Golden replays for all eight presets: identical hashes across runs, across the four JavaScript engines, frame rates and time scales.
- [ ] Fuzz: 2,000 random scenes of 10 s with no NaN, no blow-up, no tunnelling and a clean ledger.
- [ ] Undo and redo property test: random command sequences, undo all, and the scene equals the start.
- [ ] Save, reload and share-link round trips give identical hashes.
- [ ] RS1 Workshop 300 on the M4 Max at Ultra: p95 frame time at most 8.3 ms; AS CPU time at most 300 ms per simulated second at 1x, and no tick over 8 ms.
- [ ] Bench parameters are frozen in tests/validation/benches.json and every bench's negative control fails as it should.
- [ ] E2E: build a three-part contraption through the UI (not only the test API), run it, branch, compare, save, reload; zero console errors.
- [ ] The qa-player subagent builds a working catapult from a written brief using the UI only, and its notes are in the report.
- [ ] Keyboard-only path to place, join and run parts.
- [ ] Model cards and the Lab Book exist for every mechanics model.

## Ricky's playtest (20 minutes)

1. Build a trebuchet from scratch and throw something. Time how long it takes.
2. Load the domino preset, run it at 1/30 speed and watch the high-speed camera; then try 1/100 and check the "interpolated" badge appears.
3. Branch a throw, change the counterweight, and compare the two ghosts.
4. Open the energy ledger during a collision and check the losses make sense.
5. Save, close the tab, reopen, and send yourself a share link.
6. Score the fun from 1 to 10, list three annoyances and one thing you want next.

## Out of scope

Heat, fluids, fields, optics, missions, the campaign map.

## Risks and mitigations

- AS cost with many joints: profile with the perf-auditor; use sleeping and islands; raise substeps only where needed.
- Gizmo and WebGPURenderer compatibility: test TransformControls early; write a small custom gizmo if needed.
- Ghost comparison cost: run comparison timelines in the headless pool and stream only the transforms.

## Stop and ask Ricky if

The fun score is below 7 after the playtest, or a feature on this list cannot meet the gate without cutting it.
