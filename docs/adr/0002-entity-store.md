# 0002 Entity store: own SoA registry instead of bitECS 0.4
Status: accepted (15/10/2026)

Context: MASTER 5.5 names bitECS 0.4 as the default ECS and allows an ADR to change it. MASTER 5.4 requires entities to be created and iterated in id order and snapshots to restore entities under their original ids (ids feed RNG stream keys and the state hash).

Options considered:
1. bitECS 0.4.0. Reading its type definitions (dist/core/*.d.ts, dist/serialization/*.d.ts): `addEntity` allocates ids from a recycled pool and offers no way to create an entity under a chosen id; its snapshot deserialiser remaps ids through an id map; query results are in sparse-set insertion order, not id order. Restoring a snapshot bit for bit would need either a remap of every id-keyed structure or an undocumented reach into `$internal`.
2. A small registry of our own: alive flags, 32-bit component masks, typed-array stores per component field, a sorted free list, explicit serialise and deserialise that restore exact ids (src/sim/core/world.ts, about 220 lines).

Decision: option 2. bitECS is removed from the dependencies. The world keeps the structure-of-arrays layout MASTER asks for.

Consequences: full control of iteration order and snapshot format; no relation, hierarchy or query-caching features (not needed before P1; add them in the registry or revisit bitECS by ADR when the Lab's builder needs them). One fewer package in the src/sim import allowlist.

Verification: tests/unit/world.test.ts (id allocation, ascending iteration, snapshot round trip with identical hash, restored free ids) and the golden snapshot test in tests/golden/node.test.ts.
