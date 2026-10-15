// FNV-1a 64-bit hashing with 32-bit limbs (no BigInt, so it is fast and
// identical in every engine). Used for state hashes, golden replays and RNG
// stream keys.

const OFFSET_HI = 0xcbf29ce4;
const OFFSET_LO = 0x84222325;
// The FNV-1a 64 prime is 2^40 + 0x1b3.
const PRIME_LOW = 0x1b3;
const TWO32 = 4294967296;

/** Incremental FNV-1a 64 hasher. Feed bytes, numbers or strings; read hex or words. */
export class Fnv1a64 {
  private hi = OFFSET_HI;
  private lo = OFFSET_LO;
  private readonly scratch = new DataView(new ArrayBuffer(8));

  reset(): this {
    this.hi = OFFSET_HI;
    this.lo = OFFSET_LO;
    return this;
  }

  /** Mix one byte (0 to 255). */
  byte(b: number): this {
    const lo = (this.lo ^ (b & 0xff)) >>> 0;
    const hi = this.hi;
    // (hi, lo) * (2^40 + 0x1b3) mod 2^64
    const l = lo * PRIME_LOW; // < 2^41, exact
    const carry = Math.floor(l / TWO32);
    this.lo = l >>> 0;
    this.hi = (hi * PRIME_LOW + carry + ((lo << 8) >>> 0)) >>> 0;
    return this;
  }

  bytes(view: Uint8Array): this {
    for (let i = 0; i < view.length; i++) this.byte(view[i] as number);
    return this;
  }

  /** Mix a double by its IEEE 754 bytes (little-endian). -0 and +0 differ, as they should. */
  f64(x: number): this {
    this.scratch.setFloat64(0, x, true);
    for (let i = 0; i < 8; i++) this.byte(this.scratch.getUint8(i));
    return this;
  }

  /** Mix a 32-bit integer (little-endian). */
  u32(x: number): this {
    this.scratch.setUint32(0, x >>> 0, true);
    for (let i = 0; i < 4; i++) this.byte(this.scratch.getUint8(i));
    return this;
  }

  /** Mix a string as UTF-16 code units, each as two bytes. */
  str(s: string): this {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      this.byte(c & 0xff).byte(c >>> 8);
    }
    return this;
  }

  f64s(a: ArrayLike<number>): this {
    for (let i = 0; i < a.length; i++) this.f64(a[i] as number);
    return this;
  }

  /** The hash as 16 lower-case hex characters. */
  hex(): string {
    return this.hi.toString(16).padStart(8, '0') + this.lo.toString(16).padStart(8, '0');
  }

  /** The hash as two unsigned 32-bit words. */
  words(): [hi: number, lo: number] {
    return [this.hi, this.lo];
  }
}

/** Hash a string in one call (hex). */
export function fnv1a64Hex(s: string): string {
  return new Fnv1a64().str(s).hex();
}

/** Hash a string in one call (two 32-bit words). */
export function fnv1a64Words(s: string): [hi: number, lo: number] {
  return new Fnv1a64().str(s).words();
}
