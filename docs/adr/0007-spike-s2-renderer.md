# 0007 Spike S2: renderer (three.js WebGPURenderer, WebGL2 fallback)
Status: accepted with a follow-up (15/10/2026)

Context: P00 WP0.2 S2 asks for three.js r186 WebGPURenderer drawing 10,000 instanced bodies through the post-processing pipeline, measured on Ricky's Mac and under SwiftShader, plus the WebGL2 fallback drawing the same scene.

What was measured (15/10/2026):

- Ricky's Mac, Chrome 155 (WebGPU, Metal), 1920 x 1080, `npm run perf:mac`, docs/BASELINE.md, re-measured 21/10/2026 at load average 31: cube-drop and stack-1000 (1,000 cubes as individual meshes, shadows on, MSAA 4, ACES tone mapping) both run at the display's 120 Hz with frame-interval p50 8.3 ms; p95 is 9.7 ms for cube-drop (over its 8.3 ms budget, defect D-011) and 9.0 ms for stack-1000 (within its 16.7 ms stress budget). The interval is vsync-bound, so this method cannot separate GPU cost from display jitter; GPU timestamp queries arrive with the tier detector in P1. AS cost for stack-1000 over its first 8 simulated seconds, including settling: 1.05 ms per frame, 126 ms per simulated second (budget 300).
- Correction (21/10/2026): the first version of this ADR quoted 168 ms per simulated second for stack-1000. That figure was one frame's AS time at the end of the window, multiplied by the frame rate, when every cube was asleep; it was not an average. perf:mac now divides the worker's running total over the window by the simulated time advanced. ADR 0004's 911 ms per simulated second is a Node measurement of the first 5 s under heavy load and is not comparable.
- WebGL2 fallback (`?webgl=1`): boots, draws the cube, simulates identically (hash at tick 600 equals the golden), tests/e2e/webgl.spec.ts.
- SwiftShader: not measurable on macOS (device lost at first present, ADR 0009); CI on Linux measures boot and pixel readback under SwiftShader.

Not yet measured: 10,000 instanced bodies and the post-processing pipeline. The P00 renderer draws one Mesh per body (fine at 1,000) and has no post-processing yet; InstancedMesh batching and the RenderPipeline (TRAA, bloom, GTAO) are P1 work (docs/features.json will carry P01 entries for both when P1 seeds its list).

Decision: three.js 0.186.1 WebGPURenderer with its WebGL2 backend as the fallback stays. P1 adds InstancedMesh per shape and repeats this spike at 10,000 bodies with post-processing before the tier decision.

Consequences: the Ultra 120 fps budget is met for the P00 scenes with headroom unknown; MASTER 10.1's instancing rule is not yet implemented, which caps body counts at a few thousand until P1.

Verification: `npm run perf:mac`, `npm run test:e2e`.
