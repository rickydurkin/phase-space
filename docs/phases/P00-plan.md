# P00 plan - Foundations

Date: 15/10/2026. Programme v1.0.0. Session 1.

## Goal

A cube falls onto a floor in WebGPU; the run replays bit for bit in Node and in Chromium, WebKit and Firefox; every command in MASTER 13.1 exists and is real; CI configuration is in place; Ricky can open the page on his Mac.

## Decisions taken in planning (ADR 0001 records them with evidence)

- TypeScript 6.0.3 for lint tooling (typescript-eslint supports TypeScript below 6.1). The native TypeScript 7 compiler is evaluated for typecheck speed in spike S7 and adopted only by ADR if it is faster and agrees with TypeScript 6.
- ESLint 10 with typescript-eslint for the determinism rules in src/sim (restricted properties, restricted syntax for the ** operator, restricted imports by regex); dependency-cruiser for module boundaries; a tsconfig for src/sim with no DOM lib so DOM use is a type error as well as a lint error.
- Vitest 5 with projects: unit, validation, golden, fuzz, gpu.
- Node golden harness in worker_threads with throwing stubs for Math.random, Date, performance.now and the non-allowlisted Math functions.
- Rapier deterministic-compat 0.21.0, two substeps per 1/120 s tick; bitECS 0.4 for entities and queries with our own typed-array component stores and serialiser.
- Rendering: three 0.186.1 WebGPURenderer with its WebGL2 backend as fallback (forceWebGL for tests).
- HUD in plain DOM for P00; the React against Preact signals spike (S3) decides the UI library for P1.

## Order of work

1. WP0.0 bootstrap (done first, committed).
2. WP0.3 scaffold and WP0.4 deterministic core (dmath, rng, hash, units, constants, scheduler, world, snapshot, replay, ledger, mechanics).
3. WP0.6 Node side of the harness: unit tests, M1 bench, golden replay, fuzz, lint-rule tests.
4. WP0.5 presentation skeleton, then the browser side of WP0.6 (Playwright: smoke, golden in three engines, device loss, WebGL2).
5. WP0.6 GPU test through Dawn, visual, soak, perf:mac, gate.
6. WP0.7 CI, WP0.8 Claude Code setup, WP0.2 spikes with measurements, WP0.1 research refresh, WP0.9 documents.

## Risks

- Rapier deterministic build differing across JavaScript engines: tested from the first golden run in all four engines.
- SwiftShader WebGPU flags were verified on Linux only; on macOS the local e2e run may use the real GPU, and CI uses SwiftShader.
- Playwright 1.64.1 may need new browser downloads (several hundred MB).
