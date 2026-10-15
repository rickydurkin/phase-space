// sin, cos and tan: fdlibm s_sin.c, s_cos.c, s_tan.c with k_sin.c, k_cos.c,
// k_tan.c, e_rem_pio2.c and k_rem_pio2.c.
import { hi, hiu, lo, setLo, fromWords, scalbn } from './words.ts';

const half = 0.5;
const one = 1.0;
const two24 = 16777216; // 0x41700000, 0x00000000
const twon24 = 5.960464477539063e-8; // 0x3E700000, 0x00000000

// Table of constants for 2/pi, 396 hex digits (24 bits each), used by the
// large-argument reduction.
const twoOverPi = new Int32Array([
  0xa2f983, 0x6e4e44, 0x1529fc, 0x2757d1, 0xf534dd, 0xc0db62, 0x95993c, 0x439041, 0xfe5163,
  0xabdebb, 0xc561b7, 0x246e3a, 0x424dd2, 0xe00649, 0x2eea09, 0xd1921c, 0xfe1deb, 0x1cb129,
  0xa73ee8, 0x8235f5, 0x2ebb44, 0x84e99c, 0x7026b4, 0x5f7e41, 0x3991d6, 0x398353, 0x39f49c,
  0x845f8b, 0xbdf928, 0x3b1ff8, 0x97ffde, 0x05980f, 0xef2f11, 0x8b5a0a, 0x6d1f6d, 0x367ecf,
  0x27cb09, 0xb74f46, 0x3f669e, 0x5fea2d, 0x7527ba, 0xc7ebe5, 0xf17b3d, 0x0739f7, 0x8a5292,
  0xea6bfb, 0x5fb11f, 0x8d5d08, 0x560330, 0x46fc7b, 0x6babf0, 0xcfbc20, 0x9af436, 0x1da9e3,
  0x91615e, 0xe61b08, 0x659985, 0x5f14a0, 0x68408d, 0xffd880, 0x4d7327, 0x310606, 0x1556ca,
  0x73a8c9, 0x60e27b, 0xc08c6b,
]);

const npio2Hw = new Int32Array([
  0x3ff921fb, 0x400921fb, 0x4012d97c, 0x401921fb, 0x401f6a7a, 0x4022d97c, 0x4025fdbb,
  0x402921fb, 0x402c463a, 0x402f6a7a, 0x4031475c, 0x4032d97c, 0x40346b9c, 0x4035fdbb,
  0x40378fdb, 0x403921fb, 0x403ab41b, 0x403c463a, 0x403dd85a, 0x403f6a7a, 0x40407e4c,
  0x4041475c, 0x4042106c, 0x4042d97c, 0x4043a28c, 0x40446b9c, 0x404534ac, 0x4045fdbb,
  0x4046c6cb, 0x40478fdb, 0x404858eb, 0x404921fb,
]);

const PIo2 = [
  1.570796251296997, // 0x3FF921FB, 0x40000000
  7.549789415861596e-8, // 0x3E74442D, 0x00000000
  5.390302529957765e-15, // 0x3CF84698, 0x80000000
  3.282003415807913e-22, // 0x3B78CC51, 0x60000000
  1.270655753080676e-29, // 0x39F01B83, 0x80000000
  1.2293330898111133e-36, // 0x387A2520, 0x40000000
  2.7337005381646456e-44, // 0x36E38222, 0x80000000
  2.1674168387780482e-51, // 0x3569F31D, 0x00000000
];

const invpio2 = 0.6366197723675814; // 0x3FE45F30, 0x6DC9C883
const pio2_1 = 1.5707963267341256; // 0x3FF921FB, 0x54400000
const pio2_1t = 6.077100506506192e-11; // 0x3DD0B461, 0x1A626331
const pio2_2 = 6.077100506303966e-11; // 0x3DD0B461, 0x1A600000
const pio2_2t = 2.0222662487959506e-21; // 0x3BA3198A, 0x2E037073
const pio2_3 = 2.0222662487111665e-21; // 0x3BA3198A, 0x2E000000
const pio2_3t = 8.4784276603689e-32; // 0x397B839A, 0x252049C1

// Work arrays for the reduction (module-private, reused; never returned).
const y = new Float64Array(2);
const tx = new Float64Array(3);
const f = new Float64Array(20);
const fq = new Float64Array(20);
const q = new Float64Array(20);
const iq = new Int32Array(20);

/**
 * Multi-precision reduction of x[0..nx) * 2^e0 modulo pi/2 (fdlibm k_rem_pio2.c,
 * prec = 2). Writes the two-double remainder into y and returns n mod 8.
 */
function kernelRemPio2(xa: Float64Array, e0: number, nx: number): number {
  const jk = 4; // init_jk[2]
  const jp = jk;
  const jx = nx - 1;
  let jv = Math.trunc((e0 - 3) / 24);
  if (jv < 0) jv = 0;
  let q0 = e0 - 24 * (jv + 1);

  let j = jv - jx;
  const m = jx + jk;
  for (let i = 0; i <= m; i++, j++) f[i] = j < 0 ? 0 : (twoOverPi[j] as number);

  for (let i = 0; i <= jk; i++) {
    let fw = 0.0;
    for (j = 0; j <= jx; j++) fw += (xa[j] as number) * (f[jx + i - j] as number);
    q[i] = fw;
  }

  let jz = jk;
  let z!: number;
  let n!: number;
  let ih!: number;
  // The C code uses goto recompute; this loop plays that role.
  for (;;) {
    z = q[jz] as number;
    let i = 0;
    for (j = jz; j > 0; i++, j--) {
      const fw = (twon24 * z) | 0;
      iq[i] = (z - two24 * fw) | 0;
      z = (q[j - 1] as number) + fw;
    }

    z = scalbn(z, q0);
    z -= 8.0 * Math.floor(z * 0.125);
    n = z | 0;
    z -= n;
    ih = 0;
    if (q0 > 0) {
      i = (iq[jz - 1] as number) >> (24 - q0);
      n += i;
      iq[jz - 1] = (iq[jz - 1] as number) - (i << (24 - q0));
      ih = (iq[jz - 1] as number) >> (23 - q0);
    } else if (q0 === 0) ih = (iq[jz - 1] as number) >> 23;
    else if (z >= 0.5) ih = 2;

    if (ih > 0) {
      n += 1;
      let carry = 0;
      for (i = 0; i < jz; i++) {
        j = iq[i] as number;
        if (carry === 0) {
          if (j !== 0) {
            carry = 1;
            iq[i] = 0x1000000 - j;
          }
        } else iq[i] = 0xffffff - j;
      }
      if (q0 > 0) {
        switch (q0) {
          case 1:
            iq[jz - 1] = (iq[jz - 1] as number) & 0x7fffff;
            break;
          case 2:
            iq[jz - 1] = (iq[jz - 1] as number) & 0x3fffff;
            break;
          default:
            break;
        }
      }
      if (ih === 2) {
        z = one - z;
        if (carry !== 0) z -= scalbn(one, q0);
      }
    }

    if (z === 0) {
      j = 0;
      for (i = jz - 1; i >= jk; i--) j |= iq[i] as number;
      if (j === 0) {
        let k = 1;
        while (iq[jk - k] === 0) k++;
        for (i = jz + 1; i <= jz + k; i++) {
          f[jx + i] = twoOverPi[jv + i] as number;
          let fw = 0.0;
          for (j = 0; j <= jx; j++) fw += (xa[j] as number) * (f[jx + i - j] as number);
          q[i] = fw;
        }
        jz += k;
        continue;
      }
    }
    break;
  }

  if (z === 0.0) {
    jz -= 1;
    q0 -= 24;
    while (iq[jz] === 0) {
      jz--;
      q0 -= 24;
    }
  } else {
    z = scalbn(z, -q0);
    if (z >= two24) {
      const fw = (twon24 * z) | 0;
      iq[jz] = (z - two24 * fw) | 0;
      jz += 1;
      q0 += 24;
      iq[jz] = fw;
    } else iq[jz] = z | 0;
  }

  let fw = scalbn(one, q0);
  for (let i = jz; i >= 0; i--) {
    q[i] = fw * (iq[i] as number);
    fw *= twon24;
  }

  for (let i = jz; i >= 0; i--) {
    fw = 0.0;
    for (let k = 0; k <= jp && k <= jz - i; k++) fw += (PIo2[k] as number) * (q[i + k] as number);
    fq[jz - i] = fw;
  }

  fw = 0.0;
  for (let i = jz; i >= 0; i--) fw += fq[i] as number;
  y[0] = ih === 0 ? fw : -fw;
  fw = (fq[0] as number) - fw;
  for (let i = 1; i <= jz; i++) fw += fq[i] as number;
  y[1] = ih === 0 ? fw : -fw;
  return n & 7;
}

/** Reduce x modulo pi/2 into y (two doubles); returns the quadrant count n. */
function remPio2(x: number): number {
  const hx = hi(x);
  const ix = hx & 0x7fffffff;
  if (ix <= 0x3fe921fb) {
    y[0] = x;
    y[1] = 0;
    return 0;
  }
  if (ix < 0x4002d97c) {
    if (hx > 0) {
      let z = x - pio2_1;
      if (ix !== 0x3ff921fb) {
        y[0] = z - pio2_1t;
        y[1] = z - (y[0] as number) - pio2_1t;
      } else {
        z -= pio2_2;
        y[0] = z - pio2_2t;
        y[1] = z - (y[0] as number) - pio2_2t;
      }
      return 1;
    }
    let z = x + pio2_1;
    if (ix !== 0x3ff921fb) {
      y[0] = z + pio2_1t;
      y[1] = z - (y[0] as number) + pio2_1t;
    } else {
      z += pio2_2;
      y[0] = z + pio2_2t;
      y[1] = z - (y[0] as number) + pio2_2t;
    }
    return -1;
  }
  if (ix <= 0x413921fb) {
    const t = Math.abs(x);
    const n = (t * invpio2 + half) | 0;
    const fn = n;
    let r = t - fn * pio2_1;
    let w = fn * pio2_1t;
    if (n < 32 && ix !== npio2Hw[n - 1]) {
      y[0] = r - w;
    } else {
      const j = ix >> 20;
      y[0] = r - w;
      let i = j - ((hi(y[0] as number) >> 20) & 0x7ff);
      if (i > 16) {
        let tt = r;
        w = fn * pio2_2;
        r = tt - w;
        w = fn * pio2_2t - (tt - r - w);
        y[0] = r - w;
        i = j - ((hi(y[0] as number) >> 20) & 0x7ff);
        if (i > 49) {
          tt = r;
          w = fn * pio2_3;
          r = tt - w;
          w = fn * pio2_3t - (tt - r - w);
          y[0] = r - w;
        }
      }
    }
    y[1] = r - (y[0] as number) - w;
    if (hx < 0) {
      y[0] = -(y[0] as number);
      y[1] = -(y[1] as number);
      return -n;
    }
    return n;
  }
  if (ix >= 0x7ff00000) {
    y[0] = x - x;
    y[1] = y[0] as number;
    return 0;
  }
  // Large argument: z = scalbn(|x|, ilogb(x) - 23), split into 24-bit chunks.
  const e0 = (ix >> 20) - 1046;
  let z = fromWords(ix - (e0 << 20), lo(x));
  for (let i = 0; i < 2; i++) {
    tx[i] = z | 0;
    z = (z - (tx[i] as number)) * two24;
  }
  tx[2] = z;
  let nx = 3;
  while (tx[nx - 1] === 0) nx--;
  const n = kernelRemPio2(tx, e0, nx);
  if (hx < 0) {
    y[0] = -(y[0] as number);
    y[1] = -(y[1] as number);
    return -n;
  }
  return n;
}

const S1 = -0.16666666666666632; // 0xBFC55555, 0x55555549
const S2 = 0.00833333333332249; // 0x3F811111, 0x1110F8A6
const S3 = -0.0001984126982985795; // 0xBF2A01A0, 0x19C161D5
const S4 = 0.0000027557313707070068; // 0x3EC71DE3, 0x57B1FE7D
const S5 = -2.5050760253406863e-8; // 0xBE5AE5E6, 0x8A2B9CEB
const S6 = 1.58969099521155e-10; // 0x3DE5D93A, 0x5ACFD57C

function kernelSin(x: number, yy: number, iy: number): number {
  const ix = hi(x) & 0x7fffffff;
  if (ix < 0x3e400000) {
    if ((x | 0) === 0) return x;
  }
  const z = x * x;
  const v = z * x;
  const r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  if (iy === 0) return x + v * (S1 + z * r);
  return x - (z * (half * yy - v * r) - yy - v * S1);
}

const C1 = 0.0416666666666666; // 0x3FA55555, 0x5555554C
const C2 = -0.001388888888887411; // 0xBF56C16C, 0x16C15177
const C3 = 0.00002480158728947673; // 0x3EFA01A0, 0x19CB1590
const C4 = -2.7557314351390663e-7; // 0xBE927E4F, 0x809C52AD
const C5 = 2.087572321298175e-9; // 0x3E21EE9E, 0xBDB4B1C4
const C6 = -1.1359647557788195e-11; // 0xBDA8FAE9, 0xBE8838D4

function kernelCos(x: number, yy: number): number {
  const ix = hi(x) & 0x7fffffff;
  if (ix < 0x3e400000) {
    if ((x | 0) === 0) return one;
  }
  const z = x * x;
  const r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  if (ix < 0x3fd33333) return one - (0.5 * z - (z * r - x * yy));
  let qx: number;
  if (ix > 0x3fe90000) qx = 0.28125;
  else qx = fromWords(ix - 0x00200000, 0);
  const hz = 0.5 * z - qx;
  const a = one - qx;
  return a - (hz - (z * r - x * yy));
}

const T = [
  0.3333333333333341, // 3FD55555, 55555563
  0.13333333333320124, // 3FC11111, 1110FE7A
  0.05396825397622605, // 3FABA1BA, 1BB341FE
  0.021869488294859542, // 3F9664F4, 8406D637
  0.0088632398235993, // 3F8226E3, E96E8493
  0.0035920791075913124, // 3F6D6D22, C9560328
  0.0014562094543252903, // 3F57DBC8, FEE08315
  0.0005880412408202641, // 3F4344D8, F2F26501
  0.0002464631348184699, // 3F3026F7, 1A8D1068
  0.00007817944429395571, // 3F147E88, A03792A6
  0.00007140724913826082, // 3F12B80F, 32F0A7E9
  -0.000018558637485527546, // BEF375CB, DB605373
  0.00002590730518636337, // 3EFB2A70, 74BF7AD4
] as const;
const pio4 = 0.7853981633974483; // 3FE921FB, 54442D18
const pio4lo = 3.061616997868383e-17; // 3C81A626, 33145C07

function kernelTan(x: number, yy: number, iy: number): number {
  const hx = hi(x);
  const ix = hx & 0x7fffffff;
  if (ix < 0x3e300000) {
    if ((x | 0) === 0) {
      const low = lo(x);
      if ((ix | low | (iy + 1)) === 0) return one / Math.abs(x);
      if (iy === 1) return x;
      // compute -1 / (x + y) carefully
      const w = x + yy;
      const z = setLo(w, 0);
      const v = yy - (z - x);
      const a = -one / w;
      const t = setLo(a, 0);
      const s = one + t * z;
      return t + a * (s + t * v);
    }
  }
  if (ix >= 0x3fe59428) {
    if (hx < 0) {
      x = -x;
      yy = -yy;
    }
    const z = pio4 - x;
    const w = pio4lo - yy;
    x = z + w;
    yy = 0.0;
  }
  let z = x * x;
  let w = z * z;
  let r = T[1] + w * (T[3] + w * (T[5] + w * (T[7] + w * (T[9] + w * T[11]))));
  let v = z * (T[2] + w * (T[4] + w * (T[6] + w * (T[8] + w * (T[10] + w * T[12])))));
  const s = z * x;
  r = yy + z * (s * (r + v) + yy);
  r += T[0] * s;
  w = x + r;
  if (ix >= 0x3fe59428) {
    v = iy;
    return (1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - ((w * w) / (w + v) - r)));
  }
  if (iy === 1) return w;
  // compute -1.0 / (x + r) accurately
  z = setLo(w, 0);
  v = r - (z - x);
  const a = -1.0 / w;
  const t = setLo(a, 0);
  const s2 = 1.0 + t * z;
  return t + a * (s2 + t * v);
}

/** Deterministic sine (fdlibm). */
export function sin(x: number): number {
  const ix = hi(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelSin(x, 0, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x);
  const y0 = y[0] as number;
  const y1 = y[1] as number;
  switch (n & 3) {
    case 0:
      return kernelSin(y0, y1, 1);
    case 1:
      return kernelCos(y0, y1);
    case 2:
      return -kernelSin(y0, y1, 1);
    default:
      return -kernelCos(y0, y1);
  }
}

/** Deterministic cosine (fdlibm). */
export function cos(x: number): number {
  const ix = hi(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelCos(x, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x);
  const y0 = y[0] as number;
  const y1 = y[1] as number;
  switch (n & 3) {
    case 0:
      return kernelCos(y0, y1);
    case 1:
      return -kernelSin(y0, y1, 1);
    case 2:
      return -kernelCos(y0, y1);
    default:
      return kernelSin(y0, y1, 1);
  }
}

/** Deterministic tangent (fdlibm). */
export function tan(x: number): number {
  const ix = hi(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelTan(x, 0, 1);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x);
  return kernelTan(y[0] as number, y[1] as number, 1 - ((n & 1) << 1));
}

// hiu is re-exported for siblings that need the unsigned high word.
export { hiu };
