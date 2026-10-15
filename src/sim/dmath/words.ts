// Bit-level access to IEEE 754 doubles, shared by every dmath function.
// fdlibm works on the high and low 32-bit words of a double; these helpers
// reproduce GET_HIGH_WORD, GET_LOW_WORD, SET_HIGH_WORD, SET_LOW_WORD and
// INSERT_WORDS. The scratch buffer is module-private and never escapes.

const scratch = new ArrayBuffer(8);
const f64 = new Float64Array(scratch);
const u32 = new Uint32Array(scratch);
const i32 = new Int32Array(scratch);

f64[0] = 1.0;
/** Index of the high word in the 32-bit views (endianness is detected once). */
const HI = u32[1] === 0x3ff00000 ? 1 : 0;
const LO = 1 - HI;

/** High word as a signed 32-bit integer (fdlibm int32_t). */
export function hi(x: number): number {
  f64[0] = x;
  return i32[HI] as number;
}

/** High word as an unsigned 32-bit integer (fdlibm u_int32_t). */
export function hiu(x: number): number {
  f64[0] = x;
  return u32[HI] as number;
}

/** Low word as an unsigned 32-bit integer. */
export function lo(x: number): number {
  f64[0] = x;
  return u32[LO] as number;
}

/** Build a double from its high and low words. */
export function fromWords(h: number, l: number): number {
  u32[HI] = h >>> 0;
  u32[LO] = l >>> 0;
  return f64[0] as number;
}

/** Replace the high word of x. */
export function setHi(x: number, h: number): number {
  f64[0] = x;
  u32[HI] = h >>> 0;
  return f64[0] as number;
}

/** Replace the low word of x. */
export function setLo(x: number, l: number): number {
  f64[0] = x;
  u32[LO] = l >>> 0;
  return f64[0] as number;
}

const two54 = 18014398509481984; // 0x43500000, 0x00000000
const twom54 = 5.551115123125783e-17; // 0x3C900000, 0x00000000
const huge = 1.0e300;
const tiny = 1.0e-300;

function copysign(mag: number, sgn: number): number {
  const h = hiu(mag) & 0x7fffffff;
  const s = hiu(sgn) & 0x80000000;
  return setHi(mag, h | s);
}

/** x * 2^n computed exactly by exponent manipulation (fdlibm s_scalbn.c). */
export function scalbn(x: number, n: number): number {
  let hx = hi(x);
  const lx = lo(x);
  let k = (hx & 0x7ff00000) >> 20;
  if (k === 0) {
    if ((lx | (hx & 0x7fffffff)) === 0) return x;
    x *= two54;
    hx = hi(x);
    k = ((hx & 0x7ff00000) >> 20) - 54;
    if (n < -50000) return tiny * x;
  }
  if (k === 0x7ff) return x + x;
  k = k + n;
  if (k > 0x7fe) return huge * copysign(huge, x);
  if (k > 0) return setHi(x, (hx & 0x800fffff) | (k << 20));
  if (k <= -54) {
    if (n > 50000) return huge * copysign(huge, x);
    return tiny * copysign(tiny, x);
  }
  k += 54;
  x = setHi(x, (hx & 0x800fffff) | (k << 20));
  return x * twom54;
}
