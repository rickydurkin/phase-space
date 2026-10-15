// High-precision references for the dmath tests (decimal.js at 40 digits) and
// the ulp error measure. The inverse trigonometric references use a Newton
// residual computed in high precision: for t = atan_dmath(x), the true
// atan(x) = t - (tan(t) - x) / (1 + x^2) + O((tan(t) - x)^2), and the
// second-order term is below 1e-30 ulp, so this is a genuine high-precision
// reference at a fraction of the cost of Decimal.atan.
import Decimal from 'decimal.js';
import * as dmath from '../../src/sim/dmath/index.ts';

Decimal.set({ precision: 40, toExpNeg: -400, toExpPos: 400 });

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
f64[0] = 1;
const HI = u32[1] === 0x3ff00000 ? 1 : 0;

/**
 * Exact Decimal value of a double, from its bits: m * 2^e, computed with 1,100
 * digits so the product is exact for every finite double (2^-1074 has 751
 * significant decimal digits). new Decimal(x) at the working precision would
 * round away the integer part of large arguments (fatal for trig reduction)
 * and lose the low bits of subnormals. The result is copied into the working
 * constructor without rounding; later arithmetic rounds to the working precision.
 */
const EXACT = Decimal.clone({ precision: 1100, toExpNeg: -2000, toExpPos: 2000 });
const POW2 = new Map<number, Decimal>();
function pow2(e: number): Decimal {
  let v = POW2.get(e);
  if (v === undefined) {
    v = new EXACT(2).pow(e);
    POW2.set(e, v);
  }
  return v;
}

export function exact(x: number): Decimal {
  if (!Number.isFinite(x) || x === 0) return new Decimal(x);
  f64[0] = x;
  const hi = u32[HI] as number;
  const lo = u32[1 - HI] as number;
  const sign = hi >>> 31 ? -1 : 1;
  const e = (hi >>> 20) & 0x7ff;
  let m = new EXACT(hi & 0xfffff).mul(4294967296).plus(lo);
  let exp: number;
  if (e === 0) {
    exp = -1074;
  } else {
    m = m.plus(new EXACT(4503599627370496)); // implicit leading bit, 2^52
    exp = e - 1075;
  }
  return new Decimal(m.mul(pow2(exp)).mul(sign));
}

/** Size of one ulp at x. */
export function ulpOf(x: number): number {
  const ax = Math.abs(x);
  if (ax === 0 || !Number.isFinite(ax)) return 2 ** -1074;
  f64[0] = ax;
  const e = ((u32[HI] as number) >>> 20) & 0x7ff;
  if (e === 0) return 2 ** -1074;
  return 2 ** (e - 1023 - 52);
}

/** |mine - ref| in ulps of mine (Infinity when one is finite and the other is not). */
export function ulpError(mine: number, ref: Decimal): number {
  if (Number.isNaN(mine)) return ref.isNaN() ? 0 : Infinity;
  if (!Number.isFinite(mine)) {
    if (!ref.isFinite() && Math.sign(mine) === ref.s) return 0;
    // mine overflowed; accept if the reference exceeds the largest double
    return ref.abs().gt(Number.MAX_VALUE) && Math.sign(mine) === ref.s ? 0 : Infinity;
  }
  if (!ref.isFinite()) return Infinity;
  return ref.minus(exact(mine)).abs().div(ulpOf(mine)).toNumber();
}

export type Ref1 = (x: number) => Decimal;
export type Ref2 = (x: number, y: number) => Decimal;

function series(x: Decimal, terms: Decimal[]): Decimal {
  let acc = new Decimal(0);
  for (const t of terms) acc = acc.plus(t);
  return acc.plus(x);
}

export const ref1: Record<string, Ref1> = {
  sin: (x) => Decimal.sin(exact(x)),
  cos: (x) => Decimal.cos(exact(x)),
  tan: (x) => Decimal.tan(exact(x)),
  exp: (x) => Decimal.exp(exact(x)),
  expm1: (x) => {
    const d = exact(x);
    if (d.abs().lt(1e-10)) {
      const x2 = d.mul(d);
      return series(d, [x2.div(2), x2.mul(d).div(6), x2.mul(x2).div(24)]);
    }
    return Decimal.exp(d).minus(1);
  },
  log: (x) => Decimal.ln(exact(x)),
  log1p: (x) => {
    const d = exact(x);
    if (d.abs().lt(1e-10)) {
      const x2 = d.mul(d);
      return series(d, [x2.div(-2), x2.mul(d).div(3), x2.mul(x2).div(-4), x2.mul(x2).mul(d).div(5)]);
    }
    return Decimal.ln(d.plus(1));
  },
  log2: (x) => Decimal.log2(exact(x)),
  log10: (x) => Decimal.log10(exact(x)),
  sinh: (x) => Decimal.sinh(exact(x)),
  cosh: (x) => Decimal.cosh(exact(x)),
  tanh: (x) => Decimal.tanh(exact(x)),
  cbrt: (x) => Decimal.cbrt(exact(x)),
  // Newton residuals, see the header comment.
  atan: (x) => {
    const t = dmath.atan(x);
    const dt = exact(t);
    const ex = exact(x);
    const resid = Decimal.tan(dt).minus(ex);
    return dt.minus(resid.div(ex.mul(ex).plus(1)));
  },
  asin: (x) => {
    const t = dmath.asin(x);
    const dt = exact(t);
    const resid = Decimal.sin(dt).minus(exact(x));
    if (resid.isZero()) return dt;
    return dt.minus(resid.div(Decimal.cos(dt)));
  },
  acos: (x) => {
    const t = dmath.acos(x);
    const dt = exact(t);
    const resid = Decimal.cos(dt).minus(exact(x));
    if (resid.isZero()) return dt;
    return dt.plus(resid.div(Decimal.sin(dt)));
  },
};

export const ref2: Record<string, Ref2> = {
  pow: (x, y) => Decimal.pow(exact(x), exact(y)),
  atan2: (y, x) => Decimal.atan2(exact(y), exact(x)),
  hypot: (x, y) => {
    const dx = exact(x);
    const dy = exact(y);
    return dx.mul(dx).plus(dy.mul(dy)).sqrt();
  },
};

/** Small deterministic LCG for sampling. */
export class Sampler {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return this.s / 4294967296;
  }
  uniform(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  /** Log-uniform magnitude between 10^a and 10^b. */
  logUniform(a: number, b: number): number {
    return 10 ** this.uniform(a, b);
  }
  signed(x: number): number {
    return this.next() < 0.5 ? -x : x;
  }
}

/** Argument distributions per function, chosen to cover every code path of the fdlibm port. */
export function sample1(fn: string, s: Sampler): number {
  const r = s.next();
  switch (fn) {
    case 'sin':
    case 'cos':
    case 'tan':
    case 'atan':
      if (r < 0.6) return s.uniform(-10, 10);
      if (r < 0.85) return s.signed(s.logUniform(1, 6));
      if (r < 0.95) return s.signed(s.logUniform(6, 15));
      return s.signed(s.logUniform(15, 300));
    case 'exp':
      return r < 0.7 ? s.uniform(-745, 709.7) : s.signed(s.logUniform(-30, 0));
    case 'expm1':
      return r < 0.6 ? s.uniform(-40, 40) : s.signed(s.logUniform(-30, 0));
    case 'log':
    case 'log2':
    case 'log10':
      if (r < 0.6) return s.logUniform(-307, 307);
      if (r < 0.9) return 1 + s.signed(s.logUniform(-15, -1));
      return s.logUniform(-320, -307); // subnormal inputs
    case 'log1p':
      if (r < 0.4) return s.uniform(-0.9999, 1e4);
      if (r < 0.7) return s.signed(s.logUniform(-30, -1));
      return s.logUniform(1, 300);
    case 'asin':
    case 'acos':
      if (r < 0.6) return s.uniform(-1, 1);
      if (r < 0.9) return s.signed(1 - s.logUniform(-16, -1));
      return s.signed(s.logUniform(-30, -1));
    case 'sinh':
    case 'cosh':
      return r < 0.5 ? s.uniform(-700, 700) : s.signed(s.logUniform(-30, 1));
    case 'tanh':
      return r < 0.5 ? s.uniform(-25, 25) : s.signed(s.logUniform(-30, 1));
    case 'cbrt':
      return r < 0.9 ? s.signed(s.logUniform(-300, 300)) : s.signed(s.logUniform(-320, -307));
    default:
      throw new Error(`no sampler for ${fn}`);
  }
}

export function sample2(fn: string, s: Sampler): [number, number] {
  const r = s.next();
  switch (fn) {
    case 'pow': {
      let x: number;
      let y: number;
      if (r < 0.7) {
        x = s.logUniform(-5, 5);
        y = s.uniform(-30, 30);
      } else if (r < 0.85) {
        x = s.signed(s.logUniform(-3, 3));
        y = Math.round(s.uniform(-40, 40)); // integer exponents, negative bases allowed
      } else {
        x = 1 + s.signed(s.logUniform(-12, -3)); // near one with large exponents
        y = s.signed(s.logUniform(2, 8));
      }
      // keep |y log10 x| within the double range
      const mag = Math.abs(y * Math.log10(Math.abs(x)));
      if (mag > 300) y *= 300 / mag;
      return [x, y];
    }
    case 'atan2':
      return [s.signed(s.logUniform(-20, 20)), s.signed(s.logUniform(-20, 20))];
    case 'hypot':
      return [s.signed(s.logUniform(-150, 150)), s.signed(s.logUniform(-150, 150))];
    default:
      throw new Error(`no sampler for ${fn}`);
  }
}

export interface UlpReport {
  fn: string;
  samples: number;
  maxUlp: number;
  worstInput: number[];
  over2: number;
}

const ONE_ARG = ['sin', 'cos', 'tan', 'exp', 'expm1', 'log', 'log1p', 'log2', 'log10', 'atan', 'asin', 'acos', 'sinh', 'cosh', 'tanh', 'cbrt'];
const TWO_ARG = ['pow', 'atan2', 'hypot'];
export const DMATH_FUNCTIONS = [...ONE_ARG, ...TWO_ARG];

export function measure(fn: string, samples: number, seed = 0x5eed): UlpReport {
  const s = new Sampler(seed + fn.length * 7919);
  let maxUlp = 0;
  let worst: number[] = [];
  let over2 = 0;
  const d = dmath as unknown as Record<string, (...a: number[]) => number>;
  const f = d[fn];
  if (f === undefined) throw new Error(`dmath has no ${fn}`);
  if (ONE_ARG.includes(fn)) {
    const ref = ref1[fn] as Ref1;
    for (let i = 0; i < samples; i++) {
      const x = sample1(fn, s);
      const e = ulpError(f(x), ref(x));
      if (e > 2) over2++;
      if (e > maxUlp) {
        maxUlp = e;
        worst = [x];
      }
    }
  } else {
    const ref = ref2[fn] as Ref2;
    for (let i = 0; i < samples; i++) {
      const [x, y] = sample2(fn, s);
      const e = ulpError(f(x, y), ref(x, y));
      if (e > 2) over2++;
      if (e > maxUlp) {
        maxUlp = e;
        worst = [x, y];
      }
    }
  }
  return { fn, samples, maxUlp, worstInput: worst, over2 };
}
