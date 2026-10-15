# P03 - Heat and fire: The Foundry

Programme v1.0.0. Prerequisite: P02 gate closed. Typical length: 4 to 8 sessions.

## Goal

Add the thermal domain, the air grid and combustion, couple them to mechanics, and make heat visible. This is where the "one world" pillar first pays off: friction warms parts, hot steel weakens and glows, fire needs oxygen, hot air rises and lifts balloons. Ricky owns a handheld thermal camera and built Thermal Camera Lab and Heat Flow Bench, so the thermal camera must feel like the real instrument, apparent temperature and all.

## What Ricky can do at the end

Point a thermal camera at a kettle and be fooled by its shiny side; cast aluminium into a mould before it freezes; watch a schlieren view of the plume over a candle; play eight Foundry missions (the other two arrive with liquids in P4).

## Read first

- MASTER Part A; sections 5.6, 5.7, 6.2, 6.3, 9 and 10.1.
- LEARNINGS.md entries for Thermal Camera Lab, Heat Flow Bench and Nozzle Lab.
- MISSION-CATALOGUE.md R2.

## Work packages

### WP3.1 Thermal domain

Per-body thermal nodes (lumped, or segmented up to 64 nodes); contact conduction from Rapier manifolds; internal conduction; convection from local air; linearised radiation; implicit backward Euler with a fixed-iteration conjugate-gradient solve and a residual check; the enthalpy method for melting, freezing and boiling; temperature-dependent yield strength and viscosity; expansion for flagged parts, including bimetal strips. Friction and impact heating booked from mechanics through the ledger. Casting uses the 0D mould-fill model from MASTER 6.2 until P4 brings flowing liquid layers.

### WP3.2 Air grid and atmosphere

The coarse Eulerian air grid (velocity, temperature, smoke, oxygen, fuel vapour), 32 x 16 x 32 by default and fixed per scene, with flux-form advection of conserved scalars and a fixed-iteration multigrid or preconditioned conjugate-gradient projection spread across ticks; the analytic round-jet model for fans and nozzles; ISA atmosphere with humidity and realm presets; the seeded wind function. Buoyancy forces on bodies from air density differences (hot-air balloons, rising smoke). Measure the grid's cost in the first session against the AS budget in MASTER 12.

### WP3.3 Combustion

Fuels from the materials database; ignition, burn rate limited by local oxygen, heat release, smoke, light and mass loss; extinguishing by cooling and oxygen displacement; charring. Explosive materials raise a "blast" event for P8 to handle (until then they burn fast without a blast, and the model card says so).

### WP3.4 Thermal camera and thermal instruments

- Apparent temperature from emissivity-weighted long-wave radiance plus reflected surroundings, so polished metal reads cold and glass is opaque.
- Sensor model: resolution, slight blur, NETD noise and fixed-pattern noise from a seeded stream.
- Palettes: white-hot, black-hot, ironbow and inferno. Auto and manual span with a colour bar. Spot, box and line measurement tools.
- Thermocouple probes with history, isotherms, heat-flux arrows.
- On-screen display in the style of Thermal Camera Lab: cursor value, hottest, coldest, power in, net radiation.
- A two-colour pyrometer for glowing bodies (R2-10), honest about emissivity.

### WP3.5 Schlieren and shadowgraph

Computed from the air grid's density gradients with a line-of-sight integral of the refractive-index gradient (Gladstone-Dale), knife-edge and colour variants, as an instrument view.

### WP3.6 Detail layer and visuals

GPU fire and smoke volumes seeded from the AS air grid (start from three.js's webgpu_volume_fire example and its technique, not its numbers); incandescence from blackbody colour on hot bodies; heat shimmer from schlieren data; steam and embers as analytic particles. Fallback tier: simpler sprites, same AS.

### WP3.7 The Foundry realm

The 3D environment (furnace, crucibles, moulds, quench tank, kiln, canteen, workshop windows with winter sun) and eight missions: R2-01 to R2-05, R2-07, R2-09 and R2-10, with references, traps and verification. R2-06 (Leidenfrost) and R2-08 (chip pan fire) need liquids and ship in P4. Add three Daily templates (DT-R2-a to DT-R2-c) and codex entries for thermal phenomena.

### WP3.8 Lab additions

Heaters, coolers, insulation panels, thermostats (mechanical bimetal), Bunsen burners, candles, fuel blocks, a balloon envelope, thermal paint. Lab presets: cooling race, bimetal alarm, hot-air balloon, casting bench (the Leidenfrost pan arrives with liquids in P4).

## Benches

T1 to T8 and C1 to C4 (MASTER 6.2 and 6.3), plus coupling benches: friction heating equals the work done against friction within 1%; impact heating equals the kinetic energy lost minus sound and fracture within 2%.

## Missions and content

R2-01 to R2-05, R2-07, R2-09 and R2-10; DT-R2-a to DT-R2-c; at least 12 new codex entries.

## Gate

- [ ] Benches T1 to T8, C1 to C4 and the coupling benches pass.
- [ ] The ledger stays clean in all golden replays that include heat and fire.
- [ ] missions:verify passes for the eight P3 Foundry missions, and the Daily manifest covers the R2 templates.
- [ ] The thermal camera reproduces the emissivity illusion: a polished steel block at 80 °C reads at least 40 °C cooler than a painted one at the same temperature, and the model card explains why.
- [ ] RS2 Foundry Fire meets the Ultra budget on the M4 Max, and the AS stays within 300 ms per simulated second with no tick over 8 ms.
- [ ] Regression: the automated items of all earlier gates still pass.
- [ ] Zero console errors.

## Ricky's playtest (25 minutes)

1. Compare the in-game thermal camera with your real one: does it behave the same way with shiny metal, glass and a hot mug?
2. Play five Foundry missions, including Cast It and The Shiny Kettle.
3. In The Lab, light a fire in a closed box and watch it starve of oxygen.
4. Note anything that looks wrong to an engineer's eye.

## Out of scope

Liquid water as a free-flowing fluid (P4), electrical heating (P5), solar heating through optics (P6), blast waves (P8).

## Risks and mitigations

- AS cost of the air grid: measure in the first session; keep the default grid small and fixed per scene; move the grid solver to WebAssembly by ADR if profiling demands it, keeping the TypeScript version as the test reference.
- Stiff radiation at high temperatures: linearise and test the 1,000 °C case explicitly.

## Stop and ask Ricky if

The thermal camera behaviour disagrees with his real camera in a way the model cannot explain.
