# P05 - Electricity and magnetism: The Power House

Programme v1.0.0. Prerequisite: P04 gate closed. Typical length: 4 to 8 sessions.

## Goal

Add circuits, magnetic and electric fields, induction and charged particles, and couple them to mechanics, heat and (later) light. Contraptions gain motors, generators, sensors and logic, which is what makes Chain Reaction possible in P7. Fields become visible through instruments.

## What Ricky can do at the end

Wire a battery, switch and motor into a contraption; build an electromagnet crane and feel the air gap kill its grip; drop a magnet down a copper pipe and watch Lenz's law slow it; sort scrap with an eddy-current separator; tune a cyclotron.

## Read first

- MASTER Part A; sections 5.6, 5.7, 6.5, 6.6 and 9.
- MISSION-CATALOGUE.md R4.

## Work packages

### WP5.1 Circuit solver

Modified nodal analysis on the circuit clock from MASTER 5.3 (substeps no longer than the smaller of 1/(40 f_max) and tau_min/10; trapezoidal for non-stiff networks, backward Euler or BDF2 for stiff ones), Newton iterations for non-linear parts, a fixed iteration cap with a convergence check, and deterministic matrix ordering. AC sources and transformers for transient work, and phasor analysis for steady-state mains networks (R4-10). Short circuits are handled (fuse blows, wire heats) rather than producing NaN. Topology changes (switches, broken wires, melted fuses) rebuild the system deterministically.

### WP5.2 Components

Cells and batteries (internal resistance, capacity, chemical energy in the ledger), wires (resistance from material, length and cross-section; Joule heating to thermal), resistors, switches (manual, pressure plate, reed, bimetal), fuses, lamps (filament resistance rising with temperature; glow from incandescence), LEDs, DC motors and generators, capacitors, inductors and coils, relays, transistor switches, comparators and logic gates, solar cells (inactive until P6), thermocouples, thermistors, photodiodes (inactive until P6) and Hall sensors.

### WP5.3 Fields

Permanent magnets, electromagnets and induced dipoles in ferromagnetic bodies with saturation; current-carrying wires as line sources (Biot-Savart for straight segments); dipole forces and torques with near-field corrections for coils; Curie-point weakening from thermal; induction EMF from flux change through coils; eddy-current damping and heating in conductors; electrostatic forces on charged bodies; charged particles with the relativistic Boris pusher on their own clock (at least 40 substeps per gyration), and closed-form gyration between gap crossings (or at least 120 substeps) for the cyclotron, so a proton orbiting at about 15 MHz stays in phase with a fixed RF frequency as the physics says it should.

### WP5.4 Wiring and building

A wiring tool that snaps to terminals, shows current direction and magnitude as flowing markers (animated from the AS, so slow motion slows them), and labels voltages. Coils as parts with turns, gauge and core. A logic layer view that shows signals as high or low.

### WP5.5 Instruments and views

Multimeter (V, I, R, P), oscilloscope (any signal from the observation bus), gaussmeter, compass, field lines, glyph fields and slice planes with line-integral convolution, all with perceptual colour maps and readable values on hover. The 50 Hz hum and relay clicks in the audio engine.

### WP5.6 The Power House realm

A Victorian-industrial power house with a modern control room: generator hall, switchyard, a recycling line, a particle-physics corner and a rooftop for later solar work. Ten missions, R4-01 to R4-10. Three Daily templates (DT-R4-a to DT-R4-c). Codex entries for electromagnetic phenomena.

## Benches

E1 to E9 (MASTER 6.5 and 6.6), including E8 against published measurements. Coupling benches: Joule heating (E3); motor mechanical output plus losses equals electrical input within 1%; generator braking torque matches the electrical load within 1%; eddy heating equals the kinetic energy lost by a braking conductor within 2%.

## Missions and content

R4-01 to R4-10, DT-R4-a to DT-R4-c, at least 12 codex entries. Lab presets: magnet in a copper pipe, eddy brake, homopolar motor, simple generator, electromagnet crane, cyclotron.

## Gate

- [ ] Benches E1 to E9 and the coupling benches pass.
- [ ] missions:verify passes for R4, and the Daily manifest covers the R4 templates.
- [ ] Fuzz: 2,000 random circuits (including shorts and open loops) produce no NaN and keep the ledger clean.
- [ ] RS4 Power House meets the Ultra budget on the M4 Max.
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (25 minutes)

1. Play Dark Bulbs and commit your prediction honestly before closing the switch.
2. Build the electromagnet crane and find the effect of the air gap.
3. Drop magnets down copper, aluminium and plastic pipes in The Lab.
4. Try the eddy-current separator mission. Was the field view helpful?

## Out of scope

AC power networks beyond simple transformers, high-frequency electromagnetics, optics-driven components (P6 switches them on).

## Risks and mitigations

- Stiff circuits (tiny inductors, huge capacitors): implicit companion models and step-size-independent tests; reject unphysical component values in the UI with an explanation.
- Many-magnet scenes: pairwise forces are O(n^2); cap at 200 magnets per scene in v1.0 and document it in the model card.

## Stop and ask Ricky if

A mission needs a field model beyond dipoles to stay honest.
