# 0005 Spike S6: tick rate and substeps
Status: accepted (15/10/2026)

Context: MASTER 5.3 proposes a default tick of 1/120 s with two mechanics substeps, and 480 or 960 Hz ticks for slow-motion study scenes within budget. S6 measures the AS cost with mechanics only.

Measurement (tools/spikes/s6-tick.ts, reports/spike-s6.json, 300-body stack scene unless stated, two substeps per tick, Node 26.8.2, Apple M4 Max, 15/10/2026, under concurrent load):

| Tick | 300 bodies, AS ms per simulated second |
|---|---|
| 120 Hz | 187 |
| 240 Hz | 339 |
| 480 Hz | 509 |
| 960 Hz | 1,214 |

Bodies affordable within the 300 ms per simulated second budget: about 100 at 480 Hz (230 ms) and about 50 at 960 Hz (277 ms); 200 bodies at 480 Hz cost 468 ms and 100 at 960 Hz cost 620 ms.

Decision: default tick 1/120 s with two Rapier substeps (effective 240 Hz contact solve). Slow-motion study scenes may use 480 Hz with up to about 100 bodies or 960 Hz with up to about 50 bodies; these counts are recorded here and the scene schema's dt field is validated against them in P1 (impact labs). The tick is fixed per scene and recorded in every replay.

Consequences: RS1 Workshop 300 fits the budget at 120 Hz with margin for joints (not yet measured). CI runners are slower than the M4 Max; the golden and validation suites do not depend on speed.

Verification: `node tools/spikes/s6-tick.ts`; the frame-pacing and time-scale invariance test in tests/golden/node.test.ts shows the tick is independent of frame rate and time scale.
