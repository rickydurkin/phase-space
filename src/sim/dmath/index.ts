// dmath: deterministic transcendental functions for the Authoritative Simulation.
//
// JavaScript's Math.sin, Math.exp and friends are implementation-approximated
// and differ between engines and engine versions, so src/sim may not use them
// (MASTER 5.4). These are ports of fdlibm (Sun, 1993) and its FreeBSD msun
// successors: pure IEEE 754 double arithmetic, so every engine gives the same
// bits. Each function is tested against high-precision references to at most
// 2 ulp (tests/unit/dmath.test.ts and tests/validation/dmath-full.test.ts).
//
// Allowed directly from Math inside src/sim: sqrt, abs, min, max, floor, ceil,
// round, sign, fround, trunc, imul, clz32 and the constants.

export { sin, cos, tan } from './trig.ts';
export { exp, expm1 } from './exp.ts';
export { log, log1p, log2, log10 } from './log.ts';
export { pow } from './pow.ts';
export { atan, atan2, asin, acos } from './inverse.ts';
export { sinh, cosh, tanh } from './hyperbolic.ts';
export { cbrt, hypot } from './roots.ts';
export { scalbn } from './words.ts';

export const PI = 3.141592653589793;
export const TAU = 6.283185307179586;
export const E = 2.718281828459045;
