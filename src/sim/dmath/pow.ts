// pow: fdlibm e_pow.c. Special cases follow ECMAScript (Math.pow): y = +-0
// gives 1, |x| = 1 with y = +-Infinity gives NaN.
import { hi, lo, setHi, setLo, scalbn } from './words.ts';

const bp = [1.0, 1.5];
const dpH = [0.0, 0.5849624872207642]; // 0x3FE2B803, 0x40000000
const dpL = [0.0, 1.350039202129749e-8]; // 0x3E4CFDEB, 0x43CFD006
const zero = 0.0;
const one = 1.0;
const two = 2.0;
const two53 = 9007199254740992.0; // 0x43400000, 0x00000000
const huge = 1.0e300;
const tiny = 1.0e-300;
const L1 = 0.5999999999999946; // 0x3FE33333, 0x33333303
const L2 = 0.4285714285785502; // 0x3FDB6DB6, 0xDB6FABFF
const L3 = 0.33333332981837743; // 0x3FD55555, 0x518F264D
const L4 = 0.272728123808534; // 0x3FD17460, 0xA91D4101
const L5 = 0.23066074577556175; // 0x3FCD864A, 0x93C9DB65
const L6 = 0.20697501780033842; // 0x3FCA7E28, 0x4A454EEF
const P1 = 0.16666666666666602; // 0x3FC55555, 0x5555553E
const P2 = -0.0027777777777015593; // 0xBF66C16C, 0x16BEBD93
const P3 = 0.00006613756321437934; // 0x3F11566A, 0xAF25DE2C
const P4 = -0.0000016533902205465252; // 0xBEBBBD41, 0xC5D26BF1
const P5 = 4.1381367970572385e-8; // 0x3E663769, 0x72BEA4D0
const lg2 = 0.6931471805599453; // 0x3FE62E42, 0xFEFA39EF
const lg2H = 0.6931471824645996; // 0x3FE62E43, 0x00000000
const lg2L = -1.904654299957768e-9; // 0xBE205C61, 0x0CA86C39
const ovt = 8.008566259537294e-17; // -(1024 - log2(ovfl + .5ulp))
const cp = 0.9617966939259756; // 0x3FEEC709, 0xDC3A03FD = 2/(3ln2)
const cpH = 0.9617967009544373; // 0x3FEEC709, 0xE0000000 = (float)cp
const cpL = -7.028461650952758e-9; // 0xBE3E2FE0, 0x145B01F5 = tail of cp_h
const ivln2 = 1.4426950408889634; // 0x3FF71547, 0x652B82FE = 1/ln2
const ivln2H = 1.4426950216293335; // 0x3FF71547, 0x60000000 = 24b 1/ln2
const ivln2L = 1.9259629911266175e-8; // 0x3E54AE0B, 0xF85DDF44 = 1/ln2 tail

/** Deterministic x raised to the power y (fdlibm e_pow.c, ECMAScript special cases). */
export function pow(x: number, yv: number): number {
  const hx = hi(x);
  const lx = lo(x);
  const hy = hi(yv);
  const ly = lo(yv);
  let ix = hx & 0x7fffffff;
  const iy = hy & 0x7fffffff;

  if ((iy | ly) === 0) return one;
  if (
    ix > 0x7ff00000 ||
    (ix === 0x7ff00000 && lx !== 0) ||
    iy > 0x7ff00000 ||
    (iy === 0x7ff00000 && ly !== 0)
  ) {
    return x + yv;
  }

  // yisint: 0 not an integer, 1 odd integer, 2 even integer (only when x < 0)
  let yisint = 0;
  if (hx < 0) {
    if (iy >= 0x43400000) yisint = 2;
    else if (iy >= 0x3ff00000) {
      const k = (iy >> 20) - 0x3ff;
      if (k > 20) {
        const j = ly >>> (52 - k);
        if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1);
      } else if (ly === 0) {
        const j = iy >> (20 - k);
        if (j << (20 - k) === iy) yisint = 2 - (j & 1);
      }
    }
  }

  if (ly === 0) {
    if (iy === 0x7ff00000) {
      if (((ix - 0x3ff00000) | lx) === 0) return yv - yv;
      if (ix >= 0x3ff00000) return hy >= 0 ? yv : zero;
      return hy < 0 ? -yv : zero;
    }
    if (iy === 0x3ff00000) {
      if (hy < 0) return one / x;
      return x;
    }
    if (hy === 0x40000000) return x * x;
    if (hy === 0x3fe00000) {
      if (hx >= 0) return Math.sqrt(x);
    }
  }

  let ax = Math.abs(x);
  if (lx === 0) {
    if (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000) {
      let z = ax;
      if (hy < 0) z = one / z;
      if (hx < 0) {
        if (((ix - 0x3ff00000) | yisint) === 0) {
          z = (z - z) / (z - z);
        } else if (yisint === 1) z = -z;
      }
      return z;
    }
  }

  let n = (hx >> 31) + 1;
  if ((n | yisint) === 0) return (x - x) / (x - x);
  let s = one;
  if ((n | (yisint - 1)) === 0) s = -one;

  let t1: number;
  let t2: number;
  if (iy > 0x41e00000) {
    if (iy > 0x43f00000) {
      if (ix <= 0x3fefffff) return hy < 0 ? huge * huge : tiny * tiny;
      if (ix >= 0x3ff00000) return hy > 0 ? huge * huge : tiny * tiny;
    }
    if (ix < 0x3fefffff) return hy < 0 ? s * huge * huge : s * tiny * tiny;
    if (ix > 0x3ff00000) return hy > 0 ? s * huge * huge : s * tiny * tiny;
    const t = ax - one;
    const w = t * t * (0.5 - t * (0.3333333333333333 - t * 0.25));
    const u = ivln2H * t;
    const v = t * ivln2L - w * ivln2;
    t1 = setLo(u + v, 0);
    t2 = v - (t1 - u);
  } else {
    n = 0;
    if (ix < 0x00100000) {
      ax *= two53;
      n -= 53;
      ix = hi(ax);
    }
    n += (ix >> 20) - 0x3ff;
    const j = ix & 0x000fffff;
    ix = j | 0x3ff00000;
    let k: number;
    if (j <= 0x3988e) k = 0;
    else if (j < 0xbb67a) k = 1;
    else {
      k = 0;
      n += 1;
      ix -= 0x00100000;
    }
    ax = setHi(ax, ix);
    const bpk = bp[k] as number;
    const u = ax - bpk;
    const v = one / (ax + bpk);
    const ss = u * v;
    const sH = setLo(ss, 0);
    let tH = setHi(zero, ((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18));
    let tL = ax - (tH - bpk);
    const sL = v * (u - sH * tH - sH * tL);
    let s2 = ss * ss;
    let r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
    r += sL * (sH + ss);
    s2 = sH * sH;
    tH = setLo(3.0 + s2 + r, 0);
    tL = r - (tH - 3.0 - s2);
    const uu = sH * tH;
    const vv = sL * tH + tL * ss;
    const pH = setLo(uu + vv, 0);
    const pL = vv - (pH - uu);
    const zH = cpH * pH;
    const zL = cpL * pH + pL * cp + (dpL[k] as number);
    const t = n;
    t1 = setLo(zH + zL + (dpH[k] as number) + t, 0);
    t2 = zL - (t1 - t - (dpH[k] as number) - zH);
  }

  const y1 = setLo(yv, 0);
  const pL = (yv - y1) * t1 + yv * t2;
  let pH = y1 * t1;
  let z = pL + pH;
  let j = hi(z);
  const i = lo(z);
  if (j >= 0x40900000) {
    if (((j - 0x40900000) | i) !== 0) return s * huge * huge;
    if (pL + ovt > z - pH) return s * huge * huge;
  } else if ((j & 0x7fffffff) >= 0x4090cc00) {
    if (j !== (0xc090cc00 | 0) || i !== 0) return s * tiny * tiny;
    if (pL <= z - pH) return s * tiny * tiny;
  }

  const ii = j & 0x7fffffff;
  let k = (ii >> 20) - 0x3ff;
  n = 0;
  if (ii > 0x3fe00000) {
    n = j + (0x00100000 >> (k + 1));
    k = ((n & 0x7fffffff) >> 20) - 0x3ff;
    const t = setHi(zero, n & ~(0x000fffff >> k));
    n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
    if (j < 0) n = -n;
    pH -= t;
  }
  const t = setLo(pL + pH, 0);
  const u = t * lg2H;
  const v = (pL - (t - pH)) * lg2 + t * lg2L;
  z = u + v;
  const w = v - (z - u);
  const tt = z * z;
  const tt1 = z - tt * (P1 + tt * (P2 + tt * (P3 + tt * (P4 + tt * P5))));
  const r = (z * tt1) / (tt1 - two) - (w + z * w);
  z = one - (r - z);
  j = hi(z);
  j += n << 20;
  if (j >> 20 <= 0) z = scalbn(z, n);
  else z = setHi(z, j);
  return s * z;
}
