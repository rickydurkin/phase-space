// atan, atan2, asin, acos: fdlibm s_atan.c, e_atan2.c, e_asin.c, e_acos.c.
import { hi, hiu, lo, setHi, setLo } from './words.ts';

const atanhi = [
  0.4636476090008061, // atan(0.5)hi 0x3FDDAC67, 0x0561BB4F
  0.7853981633974483, // atan(1.0)hi 0x3FE921FB, 0x54442D18
  0.982793723247329, // atan(1.5)hi 0x3FEF730B, 0xD281F69B
  1.5707963267948966, // atan(inf)hi 0x3FF921FB, 0x54442D18
];
const atanlo = [
  2.2698777452961687e-17, // atan(0.5)lo 0x3C7A2B7F, 0x222F65E2
  3.061616997868383e-17, // atan(1.0)lo 0x3C81A626, 0x33145C07
  1.3903311031230998e-17, // atan(1.5)lo 0x3C700788, 0x7AF0CBBD
  6.123233995736766e-17, // atan(inf)lo 0x3C91A626, 0x33145C07
];
const aT = [
  0.3333333333333293, // 0x3FD55555, 0x5555550D
  -0.19999999999876483, // 0xBFC99999, 0x9998EBC4
  0.14285714272503466, // 0x3FC24924, 0x920083FF
  -0.11111110405462356, // 0xBFBC71C6, 0xFE231671
  0.09090887133436507, // 0x3FB745CD, 0xC54C206E
  -0.0769187620504483, // 0xBFB3B0F2, 0xAF749A6D
  0.06661073137387531, // 0x3FB10D66, 0xA0D03D51
  -0.058335701337905735, // 0xBFADDE2D, 0x52DEFD9A
  0.049768779946159324, // 0x3FA97B4B, 0x24760DEB
  -0.036531572744216916, // 0xBFA2B444, 0x2C6A6C2F
  0.016285820115365782, // 0x3F90AD3A, 0xE322DA11
] as const;
const one = 1.0;
const huge = 1.0e300;

/** Deterministic arctangent (fdlibm s_atan.c). */
export function atan(x: number): number {
  const hx = hi(x);
  const ix = hx & 0x7fffffff;
  let id: number;
  if (ix >= 0x44100000) {
    const low = lo(x);
    if (ix > 0x7ff00000 || (ix === 0x7ff00000 && low !== 0)) return x + x;
    if (hx > 0) return (atanhi[3] as number) + (atanlo[3] as number);
    return -(atanhi[3] as number) - (atanlo[3] as number);
  }
  if (ix < 0x3fdc0000) {
    if (ix < 0x3e200000) {
      if (huge + x > one) return x;
    }
    id = -1;
  } else {
    x = Math.abs(x);
    if (ix < 0x3ff30000) {
      if (ix < 0x3fe60000) {
        id = 0;
        x = (2.0 * x - one) / (2.0 + x);
      } else {
        id = 1;
        x = (x - one) / (x + one);
      }
    } else if (ix < 0x40038000) {
      id = 2;
      x = (x - 1.5) / (one + 1.5 * x);
    } else {
      id = 3;
      x = -1.0 / x;
    }
  }
  const z = x * x;
  const w = z * z;
  const s1 = z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))));
  const s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))));
  if (id < 0) return x - x * (s1 + s2);
  const zz = (atanhi[id] as number) - (x * (s1 + s2) - (atanlo[id] as number) - x);
  return hx < 0 ? -zz : zz;
}

const tiny = 1.0e-300;
const zero = 0.0;
const piO4 = 0.7853981633974483; // 0x3FE921FB, 0x54442D18
const piO2 = 1.5707963267948966; // 0x3FF921FB, 0x54442D18
const pi = 3.141592653589793; // 0x400921FB, 0x54442D18
const piLo = 1.2246467991473532e-16; // 0x3CA1A626, 0x33145C07

/** Deterministic two-argument arctangent (fdlibm e_atan2.c). */
export function atan2(yv: number, x: number): number {
  const hx = hi(x);
  const lx = lo(x);
  const ix = hx & 0x7fffffff;
  const hy = hi(yv);
  const ly = lo(yv);
  const iy = hy & 0x7fffffff;
  if ((ix | (lx !== 0 ? 1 : 0)) > 0x7ff00000 || (iy | (ly !== 0 ? 1 : 0)) > 0x7ff00000) {
    return x + yv;
  }
  if (((hx - 0x3ff00000) | lx) === 0) return atan(yv);
  const m = ((hy >> 31) & 1) | ((hx >> 30) & 2);
  if ((iy | ly) === 0) {
    switch (m) {
      case 0:
      case 1:
        return yv;
      case 2:
        return pi + tiny;
      default:
        return -pi - tiny;
    }
  }
  if ((ix | lx) === 0) return hy < 0 ? -piO2 - tiny : piO2 + tiny;
  if (ix === 0x7ff00000) {
    if (iy === 0x7ff00000) {
      switch (m) {
        case 0:
          return piO4 + tiny;
        case 1:
          return -piO4 - tiny;
        case 2:
          return 3.0 * piO4 + tiny;
        default:
          return -3.0 * piO4 - tiny;
      }
    } else {
      switch (m) {
        case 0:
          return zero;
        case 1:
          return -zero;
        case 2:
          return pi + tiny;
        default:
          return -pi - tiny;
      }
    }
  }
  if (iy === 0x7ff00000) return hy < 0 ? -piO2 - tiny : piO2 + tiny;
  const k = (iy - ix) >> 20;
  let z: number;
  if (k > 60) z = piO2 + 0.5 * piLo;
  else if (hx < 0 && k < -60) z = 0.0;
  else z = atan(Math.abs(yv / x));
  switch (m) {
    case 0:
      return z;
    case 1:
      return setHi(z, hiu(z) ^ 0x80000000);
    case 2:
      return pi - (z - piLo);
    default:
      return z - piLo - pi;
  }
}

const pio2Hi = 1.5707963267948966; // 0x3FF921FB, 0x54442D18
const pio2Lo = 6.123233995736766e-17; // 0x3C91A626, 0x33145C07
const pio4Hi = 0.7853981633974483; // 0x3FE921FB, 0x54442D18
const pS0 = 0.16666666666666666; // 0x3FC55555, 0x55555555
const pS1 = -0.3255658186224009; // 0xBFD4D612, 0x03EB6F7D
const pS2 = 0.20121253213486293; // 0x3FC9C155, 0x0E884455
const pS3 = -0.04005553450067941; // 0xBFA48228, 0xB5688F3B
const pS4 = 0.0007915349942898145; // 0x3F49EFE0, 0x7501B288
const pS5 = 0.00003479331075960212; // 0x3F023DE1, 0x0DFDF709
const qS1 = -2.403394911734414; // 0xC0033A27, 0x1C8A2D4B
const qS2 = 2.0209457602335057; // 0x40002AE5, 0x9C598AC8
const qS3 = -0.6882839716054533; // 0xBFE6066C, 0x1B8D0159
const qS4 = 0.07703815055590194; // 0x3FB3B8C5, 0xB12E9282

/** Deterministic arcsine (fdlibm e_asin.c). */
export function asin(x: number): number {
  const hx = hi(x);
  const ix = hx & 0x7fffffff;
  if (ix >= 0x3ff00000) {
    const lx = lo(x);
    if (((ix - 0x3ff00000) | lx) === 0) return x * pio2Hi + x * pio2Lo;
    return (x - x) / (x - x);
  }
  if (ix < 0x3fe00000) {
    if (ix < 0x3e400000) {
      if (huge + x > one) return x;
    }
    const t = x * x;
    const p = t * (pS0 + t * (pS1 + t * (pS2 + t * (pS3 + t * (pS4 + t * pS5)))));
    const q = one + t * (qS1 + t * (qS2 + t * (qS3 + t * qS4)));
    const w = p / q;
    return x + x * w;
  }
  let w = one - Math.abs(x);
  let t = w * 0.5;
  let p = t * (pS0 + t * (pS1 + t * (pS2 + t * (pS3 + t * (pS4 + t * pS5)))));
  let q = one + t * (qS1 + t * (qS2 + t * (qS3 + t * qS4)));
  const s = Math.sqrt(t);
  if (ix >= 0x3fef3333) {
    w = p / q;
    t = pio2Hi - (2.0 * (s + s * w) - pio2Lo);
  } else {
    w = setLo(s, 0);
    const c = (t - w * w) / (s + w);
    const r = p / q;
    p = 2.0 * s * r - (pio2Lo - 2.0 * c);
    q = pio4Hi - 2.0 * w;
    t = pio4Hi - (p - q);
  }
  return hx > 0 ? t : -t;
}

/** Deterministic arccosine (fdlibm e_acos.c). */
export function acos(x: number): number {
  const hx = hi(x);
  const ix = hx & 0x7fffffff;
  if (ix >= 0x3ff00000) {
    const lx = lo(x);
    if (((ix - 0x3ff00000) | lx) === 0) {
      if (hx > 0) return 0.0;
      return pi + 2.0 * pio2Lo;
    }
    return (x - x) / (x - x);
  }
  if (ix < 0x3fe00000) {
    if (ix <= 0x3c600000) return pio2Hi + pio2Lo;
    const z = x * x;
    const p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
    const q = one + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
    const r = p / q;
    return pio2Hi - (x - (pio2Lo - x * r));
  }
  if (hx < 0) {
    const z = (one + x) * 0.5;
    const p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
    const q = one + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
    const s = Math.sqrt(z);
    const r = p / q;
    const w = r * s - pio2Lo;
    return pi - 2.0 * (s + w);
  }
  const z = (one - x) * 0.5;
  const s = Math.sqrt(z);
  const df = setLo(s, 0);
  const c = (z - df * df) / (s + df);
  const p = z * (pS0 + z * (pS1 + z * (pS2 + z * (pS3 + z * (pS4 + z * pS5)))));
  const q = one + z * (qS1 + z * (qS2 + z * (qS3 + z * qS4)));
  const r = p / q;
  const w = r * s + c;
  return 2.0 * (df + w);
}
