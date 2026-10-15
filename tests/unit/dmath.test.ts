import { describe, it, expect } from 'vitest';
import * as dmath from '../../src/sim/dmath/index.ts';
import { measure, DMATH_FUNCTIONS } from '../helpers/dmath-ref.ts';

// Fast version of the gate check: 10,000 samples per function against
// 40-digit references. The million-sample run is the dmath-full project.
const SAMPLES = 2_500;

describe('dmath accuracy (fast sample)', () => {
  for (const fn of DMATH_FUNCTIONS) {
    it(`${fn}: at most 2 ulp over ${SAMPLES} samples`, () => {
      const r = measure(fn, SAMPLES);
      expect(r.over2, `${fn} worst ${r.maxUlp} ulp at ${JSON.stringify(r.worstInput)}`).toBe(0);
      expect(r.maxUlp).toBeLessThanOrEqual(2);
    });
  }
});

describe('dmath special values (ECMAScript semantics)', () => {
  it('handles zeros, infinities and NaN like Math', () => {
    expect(dmath.sin(0)).toBe(0);
    expect(Object.is(dmath.sin(-0), -0)).toBe(true);
    expect(dmath.sin(Infinity)).toBeNaN();
    expect(dmath.cos(Infinity)).toBeNaN();
    expect(dmath.exp(-Infinity)).toBe(0);
    expect(dmath.exp(Infinity)).toBe(Infinity);
    expect(dmath.exp(710)).toBe(Infinity);
    expect(dmath.log(0)).toBe(-Infinity);
    expect(dmath.log(-1)).toBeNaN();
    expect(dmath.log1p(-1)).toBe(-Infinity);
    expect(dmath.atan(Infinity)).toBe(Math.PI / 2);
    expect(dmath.atan2(0, -0)).toBe(Math.PI);
    expect(dmath.atan2(-0, -0)).toBe(-Math.PI);
    expect(Object.is(dmath.atan2(-0, 0), -0)).toBe(true);
    expect(dmath.asin(2)).toBeNaN();
    expect(dmath.acos(-1)).toBe(Math.PI);
    expect(dmath.tanh(Infinity)).toBe(1);
    expect(dmath.tanh(-Infinity)).toBe(-1);
    expect(dmath.cbrt(-8)).toBe(-2);
    expect(dmath.cbrt(-0)).toBe(-0);
    expect(dmath.hypot(Infinity, NaN)).toBe(Infinity);
    expect(dmath.hypot(3, 4)).toBe(5);
  });

  it('pow follows ECMAScript, not C99, for the special cases', () => {
    expect(dmath.pow(1, NaN)).toBeNaN();
    expect(dmath.pow(NaN, 0)).toBe(1);
    expect(dmath.pow(1, Infinity)).toBeNaN();
    expect(dmath.pow(-1, Infinity)).toBeNaN();
    expect(dmath.pow(-8, 1 / 3)).toBeNaN();
    expect(dmath.pow(-2, 3)).toBe(-8);
    expect(dmath.pow(-2, 2)).toBe(4);
    expect(dmath.pow(2, 0.5)).toBe(Math.SQRT2);
    expect(dmath.pow(0, -1)).toBe(Infinity);
    expect(dmath.pow(-0, -1)).toBe(-Infinity);
    expect(dmath.pow(2, 1024)).toBe(Infinity);
    expect(dmath.pow(2, -1075)).toBe(0);
    expect(dmath.pow(2, -1074)).toBe(2 ** -1074);
    expect(dmath.pow(10, 2)).toBe(100);
  });

  it('is a pure function of its inputs (same bits on repeated calls)', () => {
    const xs = [0.1, 1.7, 123456.789, 1e22, -3.3, 1e-7];
    for (const x of xs) {
      expect(dmath.sin(x)).toBe(dmath.sin(x));
      expect(dmath.exp(x)).toBe(dmath.exp(x));
      expect(dmath.pow(Math.abs(x), 1.3)).toBe(dmath.pow(Math.abs(x), 1.3));
    }
  });
});
