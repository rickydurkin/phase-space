# P09 - Engineering realms: Test Track, Warehouse and Fault Line

Programme v1.0.0. Prerequisite: P08 gate closed. Typical length: 6 to 10 sessions.

## Goal

Three realms built on kits that Ricky has already explored in depth: vehicle dynamics and crash safety (Track Day, Crumple Lab), materials handling and stability (Stability Triangle, close to his day job), and structures under earthquakes and wind (Shake Table). Each kit becomes a reusable part of the coupled world: brakes heat up and fade, tyres lose grip in the wet, forklifts tip when the load centre moves, towers resonate and dampers save them.

## What Ricky can do at the end

Find the best brake bias at 70 mph; prove from a skid mark that a driver broke the 30 mph limit; certify a sideloader on the tilt table with the least counterweight; carry 12 m timber through a narrow aisle; tune a mass damper that cuts a tower's sway by 70%; stop a footbridge wobbling.

## Read first

- MASTER Part A; sections 5.8 (handoff), 6.10 and 12.
- LEARNINGS.md entries for Track Day, Crumple Lab, Stability Triangle, Shake Table and M6 Keep Left.
- MISSION-CATALOGUE.md R7, R8 and R9.

## Work packages

### WP9.1 Vehicles kit

A Pacejka-style tyre model with combined slip, load sensitivity, temperature and wear, and water depth (aquaplaning); suspension with roll and pitch; engine torque curve, gearbox and open, limited-slip and locked differentials; brakes with bias, ABS and fade through the thermal domain; aerodynamic drag and downforce with ride height. A lumped crush structure with occupant metrics (HIC15, chest g) and handoff to rigid debris. Driver aids and an AI driver are optional; the player drives.

### WP9.2 Materials-handling kit

Generic counterbalance and multidirectional sideloader trucks (no brands), mast stages, carriage, forks, attachments and loads (pallets, long timber, pipes); the stability polygon and zero-moment-point margin with dynamic forces from acceleration, braking, turning, gradient and wind; tilt-table tests in the style of ISO 22915; load slide and fall; handoff to Rapier at the point of no return. Capacity plates computed from the model. Safe-practice penalties encoded in the scoring (travelling with the load raised, load downhill on ramps, low margin).

### WP9.3 Structures kit

Segmented beams and columns with E, I and yield; breakable connections; floors with mass; a modal analysis tool (natural frequencies and mode shapes); base excitation from synthetic ground motions (with an envelope and spectrum, labelled as synthetic); tuned mass dampers, viscous dampers and isolation bearings; drift, damage states and a repair-cost index; wind loading with a simplified flutter model (badged Plausible); a pedestrian lateral-loading model with synchronisation for footbridges (badged Plausible, with the critical crowd size on the model card) for R9-05.

### WP9.4 Instruments

g-g diagram with the friction circle, telemetry traces and lap delta, a stability polygon view with the live ZMP margin, a capacity calculator, a response spectrum plot, drift and damage overlays.

### WP9.5 Realms

- R7 The Test Track: a UK-style test circuit with a skid pan, a braking straight, a wet section and a crash lab. Six missions, R7-01 to R7-06.
- R8 The Warehouse: a racking warehouse with narrow aisles, a yard with ramps and a loading bank, a tilt table and a timber store. Six missions, R8-01 to R8-06.
- R9 Fault Line: a city block on a shake table, a footbridge over a river and a coastal tower in the wind. Six missions, R9-01 to R9-06.
- Two Daily templates per realm; codex entries.

## Benches

V1 to V3, W1 and W2, S1 to S3 (MASTER 6.10). Coupling benches: brake energy equals the heat gained by the discs within 1%; crush energy equals the kinetic energy lost minus restitution within 2%; handoff conserves momentum and energy.

## Missions and content

R7-01 to R7-06, R8-01 to R8-06, R9-01 to R9-06, DT-R7 to DT-R9 (two each), at least 15 codex entries.

## Gate

- [ ] All benches pass.
- [ ] missions:verify passes for R7, R8 and R9, and the Daily manifest covers their templates.
- [ ] Handoff tests: every handoff path conserves mass, momentum and energy within stated tolerances in golden replays.
- [ ] Driving and forklift control feel tested by the qa-player subagent through browser automation and by Ricky.
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (40 minutes)

1. Brake Bias and Skid Mark Inquest.
2. Capacity Plate and Narrow Aisle Put-away. Does the stability model match what you know from work?
3. Tuned Mass Damper and Millennium Bridge.
4. One thing that feels wrong to someone who knows forklifts.

## Out of scope

Branded vehicles or trucks, real circuit names, multiplayer racing.

## Risks and mitigations

- Vehicle feel: tune with telemetry and the g-g diagram rather than by eye; give the player assists that are honest about what they do.
- Structures cost: segment counts are fixed per scene; the modal tool runs in the headless pool.

## Stop and ask Ricky if

The materials-handling model disagrees with his professional knowledge, or a mission would read as advice about real equipment rather than a game.
