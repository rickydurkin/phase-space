---
paths:
  - "src/gpu/**"
  - "**/*.wgsl"
---
# Detail layer rules (MASTER 2.3)

- GPU results are visual only. Nothing computed here may feed back into src/sim state, except in The Lab's Unleashed mode, labelled "not deterministic, not scored".
- Every kernel has a CPU reference in src/gpu/reference and a test in tests/gpu that runs through Dawn in Node (`npm run test:gpu`).
- WGSL must pass `node tools/wgsl-validate.ts` (the PostToolUse hook runs it on every .wgsl edit).
- Do not import three.js in src/gpu; kernels and references stay renderer-independent.
- Prefer fixed-point integer atomics for scatter sums (order-independent); note multipliers per scene scale.
