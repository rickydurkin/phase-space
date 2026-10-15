// cbrt and hypot: FreeBSD msun s_cbrt.c and fdlibm e_hypot.c.
import { hi, hiu, lo, fromWords, setHi } from './words.ts';

const B1 = 715094163; // (682 - 0.03306235651) * 2**20
const B2 = 696219795; // (664 - 0.03306235651) * 2**20
const P0 = 1.87595182427177; // 0x3ffe03e6, 0x0f61e692
const P1 = -1.8849797954337717; // 0xbffe28e0, 0x92f02420
const P2 = 1.6214297201053545; // 0x3ff9f160, 0x4a49d6c2
const P3 = -0.758397934778766; // 0xbfe844cb, 0xbee751d9
const P4 = 0.14599619288661245; // 0x3fc2b000, 0xd4e4edd7

/** Deterministic cube root (FreeBSD s_cbrt.c). */
export function cbrt(x: number): number {
  let hx = hiu(x);
  const low = lo(x);
  const sign = hx & 0x80000000;
  hx ^= sign;
  if (hx >= 0x7ff00000) return x + x;
  let t: number;
  if (hx < 0x00100000) {
    if ((hx | low) === 0) return x;
    t = fromWords(0x43500000, 0); // 2**54
    t *= x;
    const high = hiu(t);
    t = fromWords(sign | (((high & 0x7fffffff) / 3) | 0) + B2, 0);
  } else {
    t = fromWords(sign | (((hx / 3) | 0) + B1), 0);
  }
  let r = t * t * (t / x);
  t = t * (P0 + r * (P1 + r * P2) + r * r * r * (P3 + r * P4));
  // Round t away from zero to 23 bits: add 2**31 to the 64-bit pattern, clear the low 30 bits.
  let th = hiu(t);
  let tl = lo(t);
  if (tl >= 0x80000000) th = (th + 1) >>> 0;
  tl = ((tl + 0x80000000) >>> 0) & 0xc0000000;
  t = fromWords(th, tl);
  const s = t * t;
  r = x / s;
  const w = t + t;
  r = (r - t) / (w + r);
  t = t + t * r;
  return t;
}

/** Deterministic sqrt(x*x + y*y) without overflow (fdlibm e_hypot.c). */
export function hypot(x: number, yv: number): number {
  let ha = hi(x) & 0x7fffffff;
  let hb = hi(yv) & 0x7fffffff;
  let a: number;
  let b: number;
  if (hb > ha) {
    a = yv;
    b = x;
    const j = ha;
    ha = hb;
    hb = j;
  } else {
    a = x;
    b = yv;
  }
  a = setHi(a, ha);
  b = setHi(b, hb);
  if (ha - hb > 0x3c00000) return a + b;
  let k = 0;
  if (ha > 0x5f300000) {
    if (ha >= 0x7ff00000) {
      let w = a + b;
      let low = lo(a);
      if (((ha & 0xfffff) | low) === 0) w = a;
      low = lo(b);
      if (((hb ^ 0x7ff00000) | low) === 0) w = b;
      return w;
    }
    ha -= 0x25800000;
    hb -= 0x25800000;
    k += 600;
    a = setHi(a, ha);
    b = setHi(b, hb);
  }
  if (hb < 0x20b00000) {
    if (hb <= 0x000fffff) {
      const low = lo(b);
      if ((hb | low) === 0) return a;
      const t1 = fromWords(0x7fd00000, 0); // 2**1022
      b *= t1;
      a *= t1;
      k -= 1022;
    } else {
      ha += 0x25800000;
      hb += 0x25800000;
      k -= 600;
      a = setHi(a, ha);
      b = setHi(b, hb);
    }
  }
  let w = a - b;
  if (w > b) {
    const t1 = fromWords(ha, 0);
    const t2 = a - t1;
    w = Math.sqrt(t1 * t1 - (b * -b - t2 * (a + t1)));
  } else {
    a = a + a;
    const y1 = fromWords(hb, 0);
    const y2 = b - y1;
    const t1 = fromWords(ha + 0x00100000, 0);
    const t2 = a - t1;
    w = Math.sqrt(t1 * y1 - (w * -w - (t1 * y2 + t2 * b)));
  }
  if (k !== 0) {
    const t1 = fromWords(0x3ff00000 + (k << 20), 0);
    return t1 * w;
  }
  return w;
}
