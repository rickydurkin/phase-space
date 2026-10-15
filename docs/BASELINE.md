# Performance baseline

Written by `npm run perf:mac` on 15/10/2026. Machine: Apple M4 Max. Browser: Chrome/155.0.0.0 (WebGPU), 1920 x 1080 viewport, 8 s per scene after 1 s warm-up.

Budgets (MASTER 12, M4 Max, Ultra): frame p95 at most 8.3 ms in reference scenes and 16.7 ms in the stress scene; AS at most 300 ms per simulated second at 1x; no tick over 8 ms.

| Scene | Tier | Frame p50 ms | p95 ms | p99 ms | fps | AS ms per frame | AS ms per simulated second |
|---|---|---|---|---|---|---|---|
| cube-drop | Ultra (P00: single tier) | 8.30 | 8.70 | 9.30 | 120 | 0.00 | 0 |
| stack-1000 | Ultra (P00: single tier) | 8.30 | 8.90 | 9.30 | 120 | 1.40 | 168 |

Frame intervals come from requestAnimationFrame deltas and are bound by the 120 Hz display (8.33 ms), so a p50 of 8.3 ms means the frame never missed vsync; GPU time per frame is not resolved until timestamp queries arrive in P1. cube-drop is the P00 reference scene; stack-1000 (1,000 cubes) stands in for the stress scene until RS1 to RS5 exist. Raw data: reports/perf-mac.json.
