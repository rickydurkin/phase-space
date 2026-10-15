// log, log1p, log2, log10: fdlibm e_log.c and s_log1p.c, and the FreeBSD msun
// e_log2.c and e_log10.c (which share k_log1p from k_log.h).
import { hi, lo, setHi, setLo } from './words.ts';

const zero = 0.0;
const ln2Hi = 0.6931471803691238; // 3fe62e42 fee00000
const ln2Lo = 1.9082149292705877e-10; // 3dea39ef 35793c76
const two54 = 18014398509481984; // 43500000 00000000
const Lg1 = 0.6666666666666735; // 3FE55555 55555593
const Lg2 = 0.3999999999940942; // 3FD99999 9997FA04
const Lg3 = 0.2857142874366239; // 3FD24924 94229359
const Lg4 = 0.22222198432149784; // 3FCC71C5 1D8E78AF
const Lg5 = 0.1818357216161805; // 3FC74664 96CB03DE
const Lg6 = 0.15313837699209373; // 3FC39A09 D078C69F
const Lg7 = 0.14798198605116586; // 3FC2F112 DF3E5244

/** Deterministic natural logarithm (fdlibm e_log.c). */
export function log(x: number): number {
  let hx = hi(x);
  const lx = lo(x);
  let k = 0;
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / zero;
    if (hx < 0) return (x - x) / zero;
    k -= 54;
    x *= two54;
    hx = hi(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  let i = (hx + 0x95f64) & 0x100000;
  x = setHi(x, hx | (i ^ 0x3ff00000));
  k += i >> 20;
  const f = x - 1.0;
  if ((0x000fffff & (2 + hx)) < 3) {
    if (f === zero) {
      if (k === 0) return zero;
      const dk = k;
      return dk * ln2Hi + dk * ln2Lo;
    }
    const R = f * f * (0.5 - 0.3333333333333333 * f);
    if (k === 0) return f - R;
    const dk = k;
    return dk * ln2Hi - (R - dk * ln2Lo - f);
  }
  const s = f / (2.0 + f);
  const dk = k;
  const z = s * s;
  i = hx - 0x6147a;
  const w = z * z;
  const j = 0x6b851 - hx;
  const t1 = w * (Lg2 + w * (Lg4 + w * Lg6));
  const t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7)));
  i |= j;
  const R = t2 + t1;
  if (i > 0) {
    const hfsq = 0.5 * f * f;
    if (k === 0) return f - (hfsq - s * (hfsq + R));
    return dk * ln2Hi - (hfsq - (s * (hfsq + R) + dk * ln2Lo) - f);
  }
  if (k === 0) return f - s * (f - R);
  return dk * ln2Hi - (s * (f - R) - dk * ln2Lo - f);
}

/** Deterministic log(1 + x) (fdlibm s_log1p.c). */
export function log1p(x: number): number {
  const hx = hi(x);
  const ax = hx & 0x7fffffff;
  let k = 1;
  let f = 0;
  let hu = 0;
  let c = 0;
  if (hx < 0x3fda827a) {
    if (ax >= 0x3ff00000) {
      if (x === -1.0) return -two54 / zero;
      return (x - x) / (x - x);
    }
    if (ax < 0x3e200000) {
      if (two54 + x > zero && ax < 0x3c900000) return x;
      return x - x * x * 0.5;
    }
    if (hx > 0 || hx <= (0xbfd2bec3 | 0)) {
      k = 0;
      f = x;
      hu = 1;
    }
  }
  if (hx >= 0x7ff00000) return x + x;
  if (k !== 0) {
    let u: number;
    if (hx < 0x43400000) {
      u = 1.0 + x;
      hu = hi(u);
      k = (hu >> 20) - 1023;
      c = k > 0 ? 1.0 - (u - x) : x - (u - 1.0);
      c /= u;
    } else {
      u = x;
      hu = hi(u);
      k = (hu >> 20) - 1023;
      c = 0;
    }
    hu &= 0x000fffff;
    if (hu < 0x6a09e) {
      u = setHi(u, hu | 0x3ff00000);
    } else {
      k += 1;
      u = setHi(u, hu | 0x3fe00000);
      hu = (0x00100000 - hu) >> 2;
    }
    f = u - 1.0;
  }
  const hfsq = 0.5 * f * f;
  if (hu === 0) {
    if (f === zero) {
      if (k === 0) return zero;
      c += k * ln2Lo;
      return k * ln2Hi + c;
    }
    const R = hfsq * (1.0 - 0.6666666666666666 * f);
    if (k === 0) return f - R;
    return k * ln2Hi - (R - (k * ln2Lo + c) - f);
  }
  const s = f / (2.0 + f);
  const z = s * s;
  const R = z * (Lg1 + z * (Lg2 + z * (Lg3 + z * (Lg4 + z * (Lg5 + z * (Lg6 + z * Lg7))))));
  if (k === 0) return f - (hfsq - s * (hfsq + R));
  return k * ln2Hi - (hfsq - (s * (hfsq + R) + (k * ln2Lo + c)) - f);
}

/** FreeBSD k_log.h: log(1 + f) - f + f*f/2 for |f| small, evaluated carefully. */
function kLog1p(f: number): number {
  const s = f / (2.0 + f);
  const z = s * s;
  const w = z * z;
  const t1 = w * (Lg2 + w * (Lg4 + w * Lg6));
  const t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7)));
  const R = t2 + t1;
  const hfsq = 0.5 * f * f;
  return s * (hfsq + R);
}

const ivln2hi = 1.4426950407214463; // 0x3ff71547, 0x65200000
const ivln2lo = 1.6751713164886512e-10; // 0x3de705fc, 0x2eefa200

/** Deterministic base-2 logarithm (FreeBSD e_log2.c). */
export function log2(x: number): number {
  let hx = hi(x);
  const lx = lo(x);
  let k = 0;
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / zero;
    if (hx < 0) return (x - x) / zero;
    k -= 54;
    x *= two54;
    hx = hi(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  if (hx === 0x3ff00000 && lx === 0) return zero;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  const i = (hx + 0x95f64) & 0x100000;
  x = setHi(x, hx | (i ^ 0x3ff00000));
  k += i >> 20;
  const yv = k;
  const f = x - 1.0;
  const hfsq = 0.5 * f * f;
  const r = kLog1p(f);
  let hiP = f - hfsq;
  hiP = setLo(hiP, 0);
  const loP = f - hiP - hfsq + r;
  let valHi = hiP * ivln2hi;
  let valLo = (loP + hiP) * ivln2lo + loP * ivln2hi;
  const w = yv + valHi;
  valLo += yv - w + valHi;
  valHi = w;
  return valLo + valHi;
}

const ivln10hi = 0.4342944818781689; // 0x3fdbcb7b, 0x15200000
const ivln10lo = 2.5082946711645275e-11; // 0x3dbb9438, 0xca9aadd5
const log10_2hi = 0.30102999566361177; // 0x3FD34413, 0x509F6000
const log10_2lo = 3.694239077158931e-13; // 0x3D59FEF3, 0x11F12B36

/** Deterministic base-10 logarithm (FreeBSD e_log10.c). */
export function log10(x: number): number {
  let hx = hi(x);
  const lx = lo(x);
  let k = 0;
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -two54 / zero;
    if (hx < 0) return (x - x) / zero;
    k -= 54;
    x *= two54;
    hx = hi(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  if (hx === 0x3ff00000 && lx === 0) return zero;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  const i = (hx + 0x95f64) & 0x100000;
  x = setHi(x, hx | (i ^ 0x3ff00000));
  k += i >> 20;
  const yv = k;
  const f = x - 1.0;
  const hfsq = 0.5 * f * f;
  const r = kLog1p(f);
  let hiP = f - hfsq;
  hiP = setLo(hiP, 0);
  const loP = f - hiP - hfsq + r;
  let valHi = hiP * ivln10hi;
  const y2 = yv * log10_2hi;
  let valLo = yv * log10_2lo + (loP + hiP) * ivln10lo + loP * ivln10hi;
  const w = y2 + valHi;
  valLo += y2 - w + valHi;
  valHi = w;
  return valLo + valHi;
}
