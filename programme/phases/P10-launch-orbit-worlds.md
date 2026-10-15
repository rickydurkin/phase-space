# P10 - Launch, Orbit and Other Worlds

Programme v1.0.0. Prerequisite: P09 gate closed. Typical length: 6 to 10 sessions.

## Goal

Take the coupled world off the ground. Rockets with real nozzle physics and staging, orbital mechanics with predictors that agree with the simulation, transfers, gravity assists, re-entry heating through the thermal domain, and Other Worlds: the same physics on the Moon, Mars, Titan, Venus and Europa with real planetary data. This phase also delivers the Model Ladder in full: missions that reward choosing the simplest model that is accurate enough.

## What Ricky can do at the end

Pick a nozzle that works from sea level to 30 km, stage a rocket into orbit, catch a pod by slowing down, swing past a planet, deflect an asteroid, survive a re-entry corridor, fly a human-powered aircraft on Titan, and discover that a siphon cannot work on Mars at all.

## Read first

- MASTER Part A; sections 5.8 (scales and handoff), 6.8 and 6.10 (rockets).
- LEARNINGS.md entries for Orrery, Gravity Well, Gravitas, Nozzle Lab and Star Forge (predictor errors, analytic tracks, model cards).
- MISSION-CATALOGUE.md R10 and R11.

## Work packages

### WP10.1 Rockets kit

Quasi-1D isentropic nozzle (expansion ratio, chamber pressure and temperature, exit pressure against ambient, a separation warning), propellant mass flow and specific impulse, thrust vectoring, staging, aerodynamic drag through the transonic region, max-Q, and aerodynamic heating to the thermal domain on ascent and re-entry. Meteoroid ablation and crater scaling (badged Plausible) for the Forensics case FB-08, which ships in this phase. Bench RK1 compares against a documented engine's published figures.

### WP10.2 Orbital simulation

f64 N-body for massive bodies with a fixed-step symplectic integrator; spacecraft with deterministic error-controlled Runge-Kutta against interpolated planet positions; burns at exact times; an accuracy banner; time warp up to 1e8x, so a century of Mercury's orbit takes about half a minute; optional 1PN; a separate orbital frame with patched handoff to surface physics near bodies (and back). Planet and moon data from published ephemerides and physical constants, with sources.

### WP10.3 Planning tools

Lambert solver, porkchop plot, Hohmann and bi-elliptic planners, Lagrange points, Hill and Roche radii, ghost orbits, mission clocks. The trajectory predictor forks the world and runs the same integrator; a test fails if prediction and flight diverge beyond rounding.

### WP10.4 Other Worlds

Realm presets with real data and sources: gravity, atmosphere (pressure, density profile, composition, temperature), surface temperature range, day length and solar irradiance for the Moon, Mars, Titan, Venus (surface and the 50 km cloud layer) and Europa. The same physics runs everywhere, so boiling points, buoyancy, drag and heat loss change for real. Each preset carries the Real badge.

### WP10.5 Model Ladder

For missions that offer it, the player chooses the model used for their prediction (for example Kepler, patched conics, N-body, N-body with 1PN) and earns the insight star for the cheapest model that meets the tolerance. The ladder is part of the mission schema and is verified: the cheapest adequate model must actually meet the tolerance and the next cheaper one must not.

### WP10.6 Realms

- R10 Launch Complex and Orbit: a coastal launch site, a test stand, low orbit, the Moon's neighbourhood and a near-Earth asteroid. Ten missions, R10-01 to R10-10.
- R11 Other Worlds: eight missions, R11-01 to R11-08, each a twist on a familiar task under different physics.
- Daily templates (DT-R10-a, DT-R10-b, DT-R11-a, DT-R11-b); codex entries.

## Benches

G1 to G6 (MASTER 6.8), RK1 and RK2 (MASTER 6.10). Handoff benches: orbit to surface and back conserve energy and momentum within stated tolerances; re-entry heating equals the work done by drag within 2%.

## Missions and content

R10-01 to R10-10, R11-01 to R11-08, FB-08 Meteorite Field, the Daily templates, at least 15 codex entries. Lab presets: Hohmann ferry, gravity-assist sandbox, Lagrange parking, Venus balloon, Titan flight.

## Gate

- [ ] All benches pass.
- [ ] missions:verify passes for R10, R11 and FB-08, including Model Ladder checks, and the Daily manifest covers the R10 and R11 templates.
- [ ] Predictor-equals-flight tests pass for every orbital mission.
- [ ] Planetary data tables carry sources and pass a review by the physics-auditor subagent.
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (40 minutes)

1. Staging and Rendezvous.
2. Planetary Defence.
3. Titan Wings and Mars Siphon.
4. Do the orbital tools explain themselves well enough at Student depth?

## Out of scope

Relativity beyond 1PN (P12, The Edge), interstellar distances, real space agencies' branding.

## Risks and mitigations

- Precision across scales: keep orbital state in f64 in its own frame; the floating origin for local scenes; tests at the extremes.
- Long time warps: adaptive, error-controlled steps for spacecraft only, while massive bodies stay on fixed-step symplectic integration; accuracy banners; never hide degraded accuracy.

## Stop and ask Ricky if

A mission idea relies on a historical mission in a way that might misrepresent it.
