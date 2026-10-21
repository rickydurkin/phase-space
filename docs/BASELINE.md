# Performance baseline

Written by `npm run perf:mac` on 21/10/2026. Machine: Apple M4 Max. Browser: Chrome/155.0.0.0 (WebGPU), 1920 x 1080 viewport, 8 s per scene after 1 s warm-up.

Budgets (MASTER 12, M4 Max, Ultra): frame p95 at most 8.3 ms in reference scenes and 16.7 ms in the stress scene; AS at most 300 ms per simulated second at 1x; no tick over 8 ms.

| Scene | Tier | Frame p50 ms | p95 ms | p99 ms | fps | AS ms per frame | AS ms per simulated second | Budget |
|---|---|---|---|---|---|---|---|---|
| cube-drop | Ultra (P00: single tier) | 8.30 | 9.70 | 10.40 | 121 | 0.19 | 23 | over budget: frame p95 over 8.3 ms |
| stack-1000 | Ultra (P00: single tier) | 8.30 | 9.00 | 10.20 | 120 | 1.05 | 126 | within budget |

Frame intervals come from requestAnimationFrame deltas and are bound by the display refresh (8.33 ms at 120 Hz), so a p50 at the refresh interval means no missed vsync, and a p95 slightly above it is display jitter that still counts against the budget; GPU time per frame is not resolved until timestamp queries arrive in P1. AS cost is the running total kept by the worker over the measured window divided by the simulated seconds advanced, timed with performance.now at 100 microsecond resolution (no cross-origin isolation), so per-frame values are averages. cube-drop is the P00 reference scene; stack-1000 (1,000 cubes) stands in for the stress scene until RS1 to RS5 exist. Raw data: reports/perf-mac.json.
