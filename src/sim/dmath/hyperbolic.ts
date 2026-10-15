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

/** Deterministic hyperbolic tangent (fdlibm s_tanh.c). */
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
    if (ix >= 0x3ff00000) {
      const t = expm1(two * Math.abs(x));
      z = one - two / (t + two);
    } else {
      const t = expm1(-two * Math.abs(x));
      z = -t / (t + two);
    }
  } else {
    z = one - tiny;
  }
  return jx >= 0 ? z : -z;
}
