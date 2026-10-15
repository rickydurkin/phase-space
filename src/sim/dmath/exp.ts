// exp and expm1: fdlibm e_exp.c and s_expm1.c.
import { hi, hiu, lo, setHi } from './words.ts';

const one = 1.0;
const huge = 1.0e300;
const tiny = 1.0e-300;
const twom1000 = 9.332636185032189e-302; // 2**-1000 = 0x01700000, 0
const oThreshold = 709.782712893384; // 0x40862E42, 0xFEFA39EF
const uThreshold = -745.1332191019411; // 0xc0874910, 0xD52D3051
const ln2HI = 0.6931471803691238; // 0x3fe62e42, 0xfee00000
const ln2LO = 1.9082149292705877e-10; // 0x3dea39ef, 0x35793c76
const invln2 = 1.4426950408889634; // 0x3ff71547, 0x652b82fe
const P1 = 0.16666666666666602; // 0x3FC55555, 0x5555553E
const P2 = -0.0027777777777015593; // 0xBF66C16C, 0x16BEBD93
const P3 = 0.00006613756321437934; // 0x3F11566A, 0xAF25DE2C
const P4 = -0.0000016533902205465252; // 0xBEBBBD41, 0xC5D26BF1
const P5 = 4.1381367970572385e-8; // 0x3E663769, 0x72BEA4D0

/** Deterministic exponential (fdlibm e_exp.c). */
export function exp(x: number): number {
  let hx = hiu(x);
  const xsb = (hx >>> 31) & 1;
  hx &= 0x7fffffff;
  let hiPart = 0.0;
  let loPart = 0.0;
  let k = 0;
  if (hx >= 0x40862e42) {
    if (hx >= 0x7ff00000) {
      const lx = lo(x);
      if (((hx & 0xfffff) | lx) !== 0) return x + x;
      return xsb === 0 ? x : 0.0;
    }
    if (x > oThreshold) return huge * huge;
    if (x < uThreshold) return twom1000 * twom1000;
  }
  if (hx > 0x3fd62e42) {
    if (hx < 0x3ff0a2b2) {
      hiPart = x - (xsb === 0 ? ln2HI : -ln2HI);
      loPart = xsb === 0 ? ln2LO : -ln2LO;
      k = 1 - xsb - xsb;
    } else {
      k = (invln2 * x + (xsb === 0 ? 0.5 : -0.5)) | 0;
      const t = k;
      hiPart = x - t * ln2HI;
      loPart = t * ln2LO;
    }
    x = hiPart - loPart;
  } else if (hx < 0x3e300000) {
    if (huge + x > one) return one + x;
  } else k = 0;
  const t = x * x;
  const c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  if (k === 0) return one - ((x * c) / (c - 2.0) - x);
  const yv = one - (loPart - (x * c) / (2.0 - c) - hiPart);
  if (k >= -1021) {
    const hy = hi(yv);
    return setHi(yv, hy + (k << 20));
  }
  const hy = hi(yv);
  return setHi(yv, hy + ((k + 1000) << 20)) * twom1000;
}

const Q1 = -0.03333333333333313; // BFA11111 111110F4
const Q2 = 0.0015873015872548146; // 3F5A01A0 19FE5585
const Q3 = -0.0000793650757867488; // BF14CE19 9EAADBB7
const Q4 = 0.000004008217827329362; // 3ED0CFCA 86E65239
const Q5 = -2.0109921818362437e-7; // BE8AFDB7 6E09C32D

/** Deterministic exp(x) - 1 (fdlibm s_expm1.c). */
export function expm1(x: number): number {
  let hx = hiu(x);
  const xsb = hx & 0x80000000;
  hx &= 0x7fffffff;
  let k!: number;
  let hiPart!: number;
  let loPart!: number;
  let c = 0;
  if (hx >= 0x4043687a) {
    if (hx >= 0x40862e42) {
      if (hx >= 0x7ff00000) {
        const low = lo(x);
        if (((hx & 0xfffff) | low) !== 0) return x + x;
        return xsb === 0 ? x : -1.0;
      }
      if (x > oThreshold) return huge * huge;
    }
    if (xsb !== 0) {
      if (x + tiny < 0.0) return tiny - one;
    }
  }
  if (hx > 0x3fd62e42) {
    if (hx < 0x3ff0a2b2) {
      if (xsb === 0) {
        hiPart = x - ln2HI;
        loPart = ln2LO;
        k = 1;
      } else {
        hiPart = x + ln2HI;
        loPart = -ln2LO;
        k = -1;
      }
    } else {
      k = (invln2 * x + (xsb === 0 ? 0.5 : -0.5)) | 0;
      const t = k;
      hiPart = x - t * ln2HI;
      loPart = t * ln2LO;
    }
    x = hiPart - loPart;
    c = hiPart - x - loPart;
  } else if (hx < 0x3c900000) {
    const t = huge + x;
    return x - (t - (huge + x));
  } else k = 0;
  const hfx = 0.5 * x;
  const hxs = x * hfx;
  const r1 = one + hxs * (Q1 + hxs * (Q2 + hxs * (Q3 + hxs * (Q4 + hxs * Q5))));
  let t = 3.0 - r1 * hfx;
  let e = hxs * ((r1 - t) / (6.0 - x * t));
  if (k === 0) return x - (x * e - hxs);
  e = x * (e - c) - c;
  e -= hxs;
  if (k === -1) return 0.5 * (x - e) - 0.5;
  if (k === 1) {
    if (x < -0.25) return -2.0 * (e - (x + 0.5));
    return one + 2.0 * (x - e);
  }
  if (k <= -2 || k > 56) {
    let yv = one - (e - x);
    yv = setHi(yv, hi(yv) + (k << 20));
    return yv - one;
  }
  t = one;
  let yv: number;
  if (k < 20) {
    t = setHi(t, 0x3ff00000 - (0x200000 >> k));
    yv = t - (e - x);
    yv = setHi(yv, hi(yv) + (k << 20));
  } else {
    t = setHi(t, (0x3ff - k) << 20);
    yv = x - (e + t);
    yv += one;
    yv = setHi(yv, hi(yv) + (k << 20));
  }
  return yv;
}
