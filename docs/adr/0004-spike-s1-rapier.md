# 0004 Spike S1: Rapier determinism and cost at 1,000 bodies
Status: accepted (15/10/2026)

Context: P00 WP0.2 S1 asks whether the Rapier deterministic build in a worker can carry 1,000 bodies at a 120 Hz tick with two substeps, what a snapshot costs, and whether restore then 600 ticks reproduces the uninterrupted run.

Measurement (tools/spikes/s1-rapier.ts, reports/spike-s1-1000.json, Node 26.8.2, Apple M4 Max, 15/10/2026, other builds running on the machine at the same time):

| Quantity | Value |
|---|---|
| Scene | stack-1000: 1,000 unit cubes dropped in a loose grid over a floor (every body awake at the start, all 1,000 asleep by tick 600) |
| Tick cost p50 / p95 / p99 / max | 4.42 ms / 22.9 ms / 42.2 ms / 112.6 ms per 1/120 s tick (two substeps) |
| Mean AS cost | 911 ms per simulated second over the first 5 s (settling, many contacts) |
| Snapshot | 1,962,378 bytes, 1,962 bytes per body; save 19.3 ms; restore 41.1 ms |
| Restore then 600 ticks | hash 64b245ee6c7b9eea, identical to the uninterrupted run |

Cross-engine: the Node golden run matches itself three times and inside the stubbed worker (tests/golden/node.test.ts). Chromium, WebKit and Firefox are compared through tests/e2e/golden.spec.ts; results in docs/phases/P00-report.md.

Decision: Rapier deterministic-compat 0.21.0 stays the mechanics engine. Snapshots are sparse checkpoints (every 2 s of sim time, MASTER 5.5) plus the input log, never every frame: at about 2 KB per body a 1,000-body scene costs 2 MB per checkpoint, 120 MB for a 120 s ring, which is the ceiling for the default ring depth; the ring depth becomes adaptive to body count in P1 (docs/IDEAS.md).

Consequences: the 300 ms per simulated second budget (MASTER 12) holds for a settled 1,000-body scene but not during a 1,000-body collapse; reference scene RS1 is 300 bodies, measured at 187 ms per simulated second in spike S6. Watch p99 ticks during large collapses (the 8 ms single-tick budget is exceeded by the stack scene's first second).

Verification: `node tools/spikes/s1-rapier.ts 1000 600` reproduces the measurement; the restore hash equality is asserted in the script output.
