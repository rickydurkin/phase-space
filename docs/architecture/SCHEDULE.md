# Tick schedule

Programme v1.0.0, physics 0.1.0. The Authoritative Simulation advances in fixed ticks of dt = 1/120 s (recorded in every replay; scenes built for slow-motion study may use 480 or 960 Hz within budget, decided by ADR 0005 after spike S6).

Order of work inside one tick (`Simulation.step` in src/sim/core/simulation.ts):

1. Inputs stamped for this tick are applied in log order (impulse, nudge, wake).
2. `ledger.beginTick()` zeroes this tick's store reports.
3. Domains step in schedule order: fields, circuits, mechanics, fluids, thermal, air and combustion, optics, acoustic events. In P00 only mechanics exists: two Rapier substeps of dt/2, then body state is mirrored into components in entity id order and kinetic and gravitational energy are reported to the ledger.
4. `ledger.endTick(tick)` books the frame and judges the 10 s window.
5. The event bus is cleared; `tick` increases by one.

Observations (`Simulation.observe`) are produced on demand by the host, not every tick. Frame pacing and the time scale live in `FrameClock` outside the authoritative state: they decide how many ticks run per rendered frame (at most 48; beyond that time is dropped and the HUD says "running below real time"), never the tick length.

State hash: FNV-1a 64 over tick, every alive entity's components in id order, the RNG stream counters in sorted key order, and the ledger stores and window. Recorded every 60 ticks in replays.
