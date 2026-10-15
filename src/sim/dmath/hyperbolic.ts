// sinh, cosh, tanh: fdlibm e_sinh.c, e_cosh.c, s_tanh.c.
import { hi, lo } from './words.ts';
import { exp, expm1 } from './exp.ts';

const one = 1.0;
const half = 0.5;
const two = 2.0;
const shuge = 1.0e307;
const huge = 1.0e300;
const tiny = 1.0e-300;

/** Deterministic hyperbolic sine (fdlibm e_sinh.c). */
export function sinh(x: number): number {
  const jx = hi(x);
  const ix = jx & 0x7fffffff;
  if (ix >= 0x7ff00000) return x + x;
  let h = 0.5;
  if (jx < 0) h = -h;
  if (ix < 0x40360000) {
    if (ix < 0x3e300000) {
      if (shuge + x > one) return x;
    }
    const t = expm1(Math.abs(x));
    if (ix < 0x3ff00000) return h * (2.0 * t - (t * t) / (t + one));
    return h * (t + t / (t + one));
  }
  if (ix < 0x40862e42) return h * exp(Math.abs(x));
  const lx = lo(x);
  if (ix < 0x408633ce || (ix === 0x408633ce && lx <= 0x8fb9f87d)) {
    const w = exp(0.5 * Math.abs(x));
    const t = h * w;
    return t * w;
  }
  return x * shuge;
}

/** Deterministic hyperbolic cosine (fdlibm e_cosh.c). */
export function cosh(x: number): number {
  let ix = hi(x);
  ix &= 0x7fffffff;
  if (ix >= 0x7ff00000) return x * x;
  if (ix < 0x3fd62e43) {
    const t = expm1(Math.abs(x));
    const w = one + t;
    if (ix < 0x3c800000) return w;
    return one + (t * t) / (w + w);
  }
  if (ix < 0x40360000) {
    const t = exp(Math.abs(x));
    return half * t + half / t;
  }
  if (ix < 0x40862e42) return half * exp(Math.abs(x));
  const lx = lo(x);
  if (ix < 0x408633ce || (ix === 0x408633ce && lx <= 0x8fb9f87d)) {
    const w = exp(half * Math.abs(x));
    const t = half * w;
    return t * w;
  }
  return huge * huge;
}

// Taylor coefficients of tanh(x)/x - 1 in powers of x^2 (Bernoulli numbers),
// used below |x| = log(5/3)/2 where the expm1 forms reach 2.1 ulp.
const T1 = -1 / 3;
const T2 = 2 / 15;
const T3 = -17 / 315;
const T4 = 62 / 2835;
const T5 = -1382 / 155925;
const T6 = 21844 / 6081075;
const T7 = -929569 / 638512875;
const T8 = 6404582 / 10854718875;
const T9 = -443861162 / 1856156927625;
const T10 = 18888466084 / 194896477400625;
// -113927491862 / 49308808782358125; the denominator exceeds 2^53, so the quotient is stored directly
const T11 = -0.000002310489640195108;

/**
 * Deterministic hyperbolic tangent. fdlibm s_tanh.c for |x| > log(3)/2, the
 * t/(t+2) form with t = expm1(2|x|) (as in musl) for log(5/3)/2 < |x| <= log(3)/2,
 * and a Taylor series in x^2 below that. The expm1-based forms reach 2.03 to
 * 2.12 ulp on a few inputs per 10,000 in the small range (measured 15/10/2026);
 * the series evaluates to under 1 ulp there because the correction x * p is a
 * small fraction of x.
 */
export function tanh(x: number): number {
  const jx = hi(x);
  const ix = jx & 0x7fffffff;
  if (ix >= 0x7ff00000) {
    if (jx >= 0) return one / x + one;
    return one / x - one;
  }
  let z: number;
  if (ix < 0x40360000) {
    if (ix < 0x3c800000) return x * (one + x);
    const ax = Math.abs(x);
    if (ix > 0x3fe193ea) {
      // |x| > log(3)/2: 1 - 2/(expm1(2|x|) + 2)
      const t = expm1(two * ax);
      z = one - two / (t + two);
    } else if (ix > 0x3fd058ae) {
      // |x| > log(5/3)/2: t/(t+2) with t = expm1(2|x|) > 0
      const t = expm1(two * ax);
      z = t / (t + two);
    } else {
      const y = ax * ax;
      const p =
        y *
        (T1 +
          y * (T2 + y * (T3 + y * (T4 + y * (T5 + y * (T6 + y * (T7 + y * (T8 + y * (T9 + y * (T10 + y * T11))))))))));
      z = ax + ax * p;
    }
  } else {
    z = one - tiny;
  }
  return jx >= 0 ? z : -z;
}
