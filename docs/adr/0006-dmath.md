# 0006 Spike S5: deterministic maths (dmath)
Status: accepted (15/10/2026)

Context: MASTER 5.4 bans the implementation-approximated Math functions in src/sim and requires fdlibm-derived replacements accurate to 2 ulp against high-precision references over a million samples each.

Implementation: src/sim/dmath ports fdlibm (sin, cos, tan with e_rem_pio2 and k_rem_pio2; exp, expm1; log, log1p; atan, atan2, asin, acos; sinh, cosh, tanh; pow with ECMAScript special cases; scalbn) and FreeBSD msun (log2, log10 with k_log1p; cbrt). hypot is fdlibm e_hypot. Pure IEEE 754 double arithmetic, no fused operations, so the bits are the same in every engine.

Accuracy (tests/helpers/dmath-ref.ts, decimal.js at 40 digits with inputs converted exactly from the double's bits; the inverse trigonometric references use a Newton residual computed in high precision): the fast sample of 2,500 inputs per function is in verify:fast; the million-sample run is `npm run test:dmath:full` (results in docs/phases/P00-report.md). Independent adjudication of sin at 1e30 with bc (120 digits) agreed with dmath and with V8 to 16 digits, and exposed that references built from a double's shortest decimal string are not exact.

Cost (tools/spikes/s5-dmath-cost.ts, reports/spike-s5.json, a million calls each, Node 26.8.2, M4 Max):

| Function | dmath ns | Math ns | ratio |
|---|---|---|---|
| sin / cos / tan | 55 / 59 / 52 | 42 / 42 / 33 | 1.3 / 1.4 / 1.6 |
| exp / expm1 | 27 / 32 | 16 / 32 | 1.7 / 1.0 |
| log / log1p / log2 / log10 | 22 / 27 / 20 / 23 | 17 / 16 / 15 / 29 | 1.3 / 1.7 / 1.3 / 0.8 |
| atan / asin / acos / atan2 | 29 / 39 / 39 / 45 | 21 / 28 / 31 / 28 | 1.4 / 1.4 / 1.2 / 1.6 |
| sinh / cosh / tanh | 53 / 48 / 56 | 28 / 25 / 31 | 1.9 / 1.9 / 1.8 |
| cbrt / hypot / pow | 51 / 32 / 117 | 19 / 18 / 20 | 2.7 / 1.8 / 5.9 |

Decision: dmath is the only source of transcendental functions in src/sim; lint enforces it (tools/eslint/plugin-sim.js). The cost is acceptable: a scene calling 100,000 transcendental functions per tick would spend about 5 ms, far above anything P1 to P6 need per tick. pow is the slow one; integer powers should be written as multiplications.

Consequences: V8's Math on Apple Silicon differs from dmath by 1 to 2 ulp on some inputs (fused multiply-add); golden hashes therefore depend on dmath, never on Math, which is the point.

Verification: `npm run test:unit` (fast sample), `npm run test:dmath:full` (gate), `node tools/spikes/s5-dmath-cost.ts`.
