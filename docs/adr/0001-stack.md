# 0001 Toolchain and stack for P00
Status: accepted (15/10/2026)

Context: MASTER section 11 names defaults checked on 14/10/2026. On 15/10/2026 every pinned version still exists on npm (three 0.186.1, Rapier deterministic-compat 0.21.0, Vite 8.3.4, Vitest 5.0.4, Playwright 1.64.1, webgpu 0.6.2, fast-check 4.10.2, zod 4.6.7, comlink 4.4.2). Two defaults needed a decision.

Options considered:
1. TypeScript 7.0.2 everywhere. typescript-eslint 8.71.2 declares a peer range of TypeScript below 6.1.0, so lint would run unsupported.
2. TypeScript 6.0.3 for lint and typecheck, TypeScript 7 only once typescript-eslint supports it. Measured: `tsc -p tsconfig.sim.json` takes 0.3 s with 6.0.3 on the P00 code base, so there is no speed pressure yet.
3. Biome instead of ESLint. Biome parses TypeScript itself, but the determinism rules need custom logic (Math member allowlist, import allowlist with a package exception, the ** operator); a small ESLint plugin (tools/eslint/plugin-sim.js) expresses them directly and tests/unit/lint-rules.test.ts proves each rule fires.

Decision: TypeScript 6.0.3 with ESLint 10 and typescript-eslint 8.71 (option 2 plus 3's rejection). Re-evaluate TypeScript 7 at the P1 research refresh. dependency-cruiser 18.6 enforces module boundaries; a separate tsconfig for src/sim with no DOM lib makes DOM use a type error as well.

Consequences: lint, typecheck and editor tooling agree on one TypeScript. Typecheck speed is not a concern at this size. Watch: typescript-eslint adding TypeScript 7 support.

Verification: `npm run verify:fast` runs typecheck, lint and the lint-rule tests; `npm run depcruise` runs the boundary rules.
