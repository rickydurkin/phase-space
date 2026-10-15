---
paths:
  - "src/sim/**"
---
# Authoritative Simulation rules (MASTER 2.1, 5.3, 5.4)

- CPU only, fixed tick, no wall clock. Never read Date, performance, timers, DOM or network here.
- Randomness only through `src/sim/rng`: `rng.stream("cause", ...ids)`. Never Math.random.
- Maths: only `Math.sqrt, abs, min, max, floor, ceil, round, sign, fround, trunc, imul, clz32` and constants. Everything else (sin, cos, exp, log, pow, atan2, tanh and so on, and the `**` operator) comes from `src/sim/dmath`.
- Imports: relative modules and `@dimforge/rapier3d-deterministic-compat` only. Adding a package needs an ADR with a determinism test.
- Entities are created and iterated in id order (`world.entities()` is sorted). Insert Rapier bodies in a stable order.
- Every domain implements `DomainModule` (src/sim/core/types.ts) and reports its energy stores to the ledger each tick.
- A change that alters a golden hash bumps `PHYSICS_VERSION` in src/sim/version.ts and gets a line in docs/PHYSICS-CHANGELOG.md; golden files are regenerated with `node tools/golden.ts --write <scene>` only then.
- No `console` here. Surface information through observations or events.
- Keep syntax erasable (no enums, no parameter properties, `import type` for types): the golden worker loads these files with Node's type stripping.
