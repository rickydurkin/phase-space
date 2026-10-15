# P08 - The Proving Ground: projectiles, sound and shock

Programme v1.0.0. Prerequisite: P07 gate closed. Typical length: 4 to 7 sessions.

## Goal

Bring Mach Cone's depth to the coupled world without its weapons. Fast projectiles with real drag, wind, spin and Coriolis; sound that travels at the speed of sound and shifts with Doppler; Mach cones and booms; blast waves that push and break things; resonance that shatters glass. Everything framed through sport, engineering, space, weather and history (rule 2.12).

## What Ricky can do at the end

Bend a free kick around a wall with Magnus force, land a supply crate on a moving barge in a crosswind, triangulate a supersonic jet from its boom arrival times, shatter one glass out of five with the right tone, and design a Whipple shield that stops space debris at 7 km/s.

## Read first

- MASTER Part A; sections 5.3 (continuous-time models), 6.9 and 6.10 (projectiles).
- LEARNINGS.md entries for Mach Cone, Ballistica, Terminal Ballistics Lab, Hertz Hall and Demolition Reconstructor.
- MISSION-CATALOGUE.md R6.

## Work packages

### WP8.1 Projectile kit

The fast-body integrator: RK4 on a fine fixed grid with Hermite output, sampled at any view time, with swept ray hits and handoff to rigid bodies at impact. Cd(Mach) tables for spheres, smooth and dimpled balls (drag crisis), cylinders and fin-stabilised shapes; wind sampled from the seeded field at the predicted midpoint; Coriolis from latitude and heading; spin decay and Magnus. Sports balls (football, golf, cricket, tennis) with published lift and drag data and sources.

### WP8.2 Sound propagation, full

Speed of sound from local temperature, wind advection, Doppler from per-source delay lines, spherical spreading and ISO 9613-1 absorption, occlusion, simple image-source reflections for walls and the ground. Microphones as instruments with arrival times, levels and a spectrogram. Crack-then-thump ordering for supersonic objects.

### WP8.3 Shock and blast

Mach cone geometry for supersonic bodies with boom events at the listener crossing (retarded time) and N-wave synthesis; acoustic rays traced through the layered atmosphere's sound-speed profile so the boom carpet has its real width and lateral cutoff (R6-08); schlieren view of shocks; blast waves from explosive materials using scaled distance with Kingery-Bulmash or Friedlander fits, applying impulses to bodies at arrival time, with fracture where pressure exceeds strength. Model cards state the valid ranges and what is simplified.

### WP8.4 Resonance and fracture by sound

Driven oscillators with Q from material damping; glassware with natural frequencies from geometry and fill level; fracture when the stress amplitude exceeds strength.

### WP8.5 Hypervelocity impact (simplified)

A model-card-honest impact model for space debris against spaced shields (projectile break-up at the first bumper, spread of the debris cloud, rear-wall loading), anchored to published ballistic-limit curves and labelled Plausible.

### WP8.6 The Proving Ground realm

A test range with a sports pitch, a historical siege-engine field, a supersonic test corridor over the sea, a glassware acoustics lab and a space-debris test chamber. Eight missions, R6-01 to R6-08. Three Daily templates (DT-R6-a to DT-R6-c). Codex entries.

## Benches

A1 to A6 (MASTER 6.9) and PJ1 to PJ3 (MASTER 6.10).

## Missions and content

R6-01 to R6-08, DT-R6-a to DT-R6-c, at least 10 codex entries, and CR-04 The Long Way Round, the first seven-domain Chain Reaction now that sound can carry energy (microphones, resonance, blast). Lab presets: banana kick, knuckleball, trebuchet range, boom corridor, glass harp, Whipple test.

## Gate

- [ ] Benches A1 to A6 and PJ1 to PJ3 pass.
- [ ] missions:verify passes for R6 and CR-04, and the Daily manifest covers the R6 templates.
- [ ] The chain tracker scores a scripted seven-domain chain exactly as computed by hand.
- [ ] Projectile paths are identical when viewed at 1x, 1/1,000x and through the high-speed camera (the continuous-time model test).
- [ ] Audio arrival times in an E2E scene match d/c within one audio render quantum.
- [ ] Content review: no human or animal targets and no real-world firearms anywhere in R6 (checked by the mission-critic subagent against rule 2.12).
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (25 minutes)

1. Banana Kick and Supply Drop.
2. Boom Triangulation: place the microphones and reconstruct the path.
3. In The Lab, compare a smooth ball and a dimpled ball through the drag crisis.
4. Does this realm feel as deep as Mach Cone in the places that matter to you?

## Out of scope

Real firearms, human or animal targets, terminal ballistics in tissue.

## Risks and mitigations

- Audio CPU cost with many sources: voice stealing by loudness, HRTF for the nearest few, a cheaper bed for the rest.
- Blast realism versus simplicity: anchor to published curves, badge as Plausible, and keep missions to the model's valid range.

## Reusing Mach Cone

Mach Cone's physics core (exterior ballistics, the ICAO atmosphere, wind field, acoustics) is DOM-free, written in SI and tested in Node. Ask Ricky whether he wants it ported. If he supplies the source, port the parts this phase needs into TypeScript with their tests, re-check them against benches A1 to A6 and PJ1 to PJ3, and leave out anything tied to firearms.

## Stop and ask Ricky if

The port above is wanted, or a mission idea sits close to the line drawn by rule 2.12.
