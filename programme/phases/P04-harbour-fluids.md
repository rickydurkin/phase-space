# P04 - Water and sand: The Harbour

Programme v1.0.0. Prerequisite: P03 gate closed. Typical length: 5 to 8 sessions.

## Goal

Add water, liquids and granular matter to the authoritative simulation, couple them two ways with rigid bodies and heat, and add the GPU detail layer that makes water look alive. This phase also introduces The Lab's Unleashed mode, where full GPU MPM runs with two-way coupling for spectacle, clearly labelled as not deterministic and not scored.

## What Ricky can do at the end

Load a barge to its Plimsoll line, drain a flooded basin with a siphon, work a canal lock, build a water clock, pour molten metal that cools into a casting, and watch a dam break in slow motion with spray that looks real.

## Read first

- MASTER Part A; sections 2.3, 5.6, 6.4, 10.1, 10.2 and 12.
- RESEARCH-SNAPSHOT sections 3 (GPU continuum) and 6 (rendering).
- LEARNINGS.md entries for Bernoulli's Garage (calibration honesty) and Newton's Playground (drag in thick fluids).
- MISSION-CATALOGUE.md R3.

## Work packages

### WP4.1 Shallow water

Shallow-water equations on a heightfield grid with a well-balanced finite-volume scheme, wet and dry fronts, Manning bed friction, CFL-limited deterministic substeps, inflow and outflow boundaries, and a fixed resolution per scene. Mass conservation is exact to rounding. Waves, tides and currents as scene settings.

### WP4.2 Vessels and plumbing

0D tanks connected by pipes with Darcy-Weisbach losses (Colebrook friction factor for turbulent flow), valves, pumps (power to head), turbines (head to shaft power), siphons and overflow. A pipe tool in the Lab. Couplings: shaft power to mechanics; heat carried by flow to thermal.

### WP4.3 Body coupling

Buoyancy from the exact submerged volume of convex hulls clipped against the local water surface; drag and added mass from relative velocity; bodies displace water through source terms so boats make wakes and floods push crates. Two-way and deterministic.

### WP4.4 Viscous layers and casting

Lava, molten metal and oil as additional layers with temperature-dependent viscosity, heat exchange with the thermal domain and solidification into cast bodies (a handoff from layer to rigid body with mass and energy conserved).

### WP4.4b Boiling and drops

Boiling heat transfer by regime (nucleate, transition, film) with a Leidenfrost temperature per liquid and surface, badged Plausible, and small liquid drops as tracked bodies. This completes the Foundry: ship R2-06 (Leidenfrost Drops) and R2-08 (Chip Pan Fire) in this phase, plus the Leidenfrost pan Lab preset.

### WP4.5 Granular matter

Sand and gravel heightfields with angle-of-repose relaxation, erosion by flowing water (simple, documented in the model card), digging, scooping and pouring; small piles as rigid clumps.

### WP4.6 Detail layer: MPM and fluid rendering

3D MLS-MPM on WebGPU for spray, splashes and foam, seeded from AS fluxes each frame, with fixed-point integer atomics for the particle-to-grid scatter. Screen-space fluid rendering (depth, thickness, bilateral smoothing, normals from depth, refraction by thickness) at the tier's resolution. Particle budgets per tier from MASTER 12, measured on the M4 Max and confirmed by ADR. Every kernel has a CPU reference implementation and a Dawn-in-Node test.

### WP4.7 Unleashed Lab

A Lab toggle that runs full GPU MPM with two-way coupling: grid impulses on a small number of floating bodies are summed on the GPU, read back one frame late and applied as forces. The badge reads "Unleashed: not deterministic, not scored"; replays in this mode store frequent checkpoints and are marked approximate.

### WP4.8 Flow instruments

Flow view (streamlines, smoke wand, tracers), pressure gauges, flow meters, hydrometer (density), depth sounder.

### WP4.9 The Harbour realm

The estuary environment (sea quay, river wharf, canal lock, dam and reservoir, beach, boatyard) and ten missions, R3-01 to R3-10. Three Daily templates (DT-R3-a to DT-R3-c). Codex entries for fluid phenomena.

## Benches

F1 to F9 (MASTER 6.4). Coupling benches: buoyant body at rest in still water conserves energy within 1% over 60 s; shaft power from a turbine equals rho g Q h eta within 1%; casting handoff conserves mass exactly and energy within 0.5%.

## Missions and content

R3-01 to R3-10 (including R3-05 Plimsoll Line from MASTER Appendix B), R2-06 and R2-08 for the Foundry, DT-R3-a to DT-R3-c, at least 12 codex entries.

## Gate

- [ ] Benches F1 to F9 and the coupling benches pass.
- [ ] missions:verify passes for R3, R2-06 and R2-08, and the Daily manifest covers the R3 templates.
- [ ] Golden replays with water, plumbing, sand and casting are deterministic across the four JavaScript engines.
- [ ] Detail layer: every WGSL kernel matches its CPU reference within stated tolerances in test:gpu; removing the detail layer (WebGL2 tier) changes no AS hash.
- [ ] RS3 Harbour Storm meets the Ultra budget on the M4 Max with the measured particle budget.
- [ ] Unleashed mode is badged correctly and cannot submit scores (E2E test).
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (25 minutes)

1. Play Plimsoll Line, Lock Keeper and Dam Break.
2. Build a siphon in The Lab and find the height where it stops working.
3. Turn on Unleashed mode and throw things into water. Does it look and feel right at Ultra?
4. Note any water behaviour that looks wrong.

## Out of scope

Electrical pumps and generators (P5 wires them up), sea-going ships at ocean scale, MPM in the AS.

## Risks and mitigations

- Shallow-water instability at wet and dry fronts: use a positivity-preserving scheme and fuzz with random terrains.
- Buoyancy jitter on small bodies: substep the coupling and clamp added-mass effects; benchmark with the fuzzer.
- MPM fixed-point overflow: choose the multiplier per scene scale, assert ranges in debug builds, test extremes.

## Stop and ask Ricky if

The detail layer cannot meet the Ultra budget at a particle count that looks good to him.
