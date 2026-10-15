// Deterministic random numbers for the Authoritative Simulation.
//
// Counter-based design: each stream is a key derived from its cause (a string
// plus any integer ids) and a counter; output i of a stream is a pure function
// of (key, i). Streams never interfere, so adding a new consumer of randomness
// never shifts the numbers another consumer sees (MASTER 5.4). The only state
// is one counter per stream, which makes snapshots trivial.
//
// Mixing function: MurmurHash3 x86_32 over four 32-bit words (seed-keyed).
// Quality is ample for game physics; it is not cryptographic.

import { Fnv1a64 } from '../core/hash.ts';

function rotl32(x: number, r: number): number {
  return ((x << r) | (x >>> (32 - r))) >>> 0;
}

function mixWord(h: number, k: number): number {
  k = Math.imul(k, 0xcc9e2d51);
  k = rotl32(k, 15);
  k = Math.imul(k, 0x1b873593);
  h = (h ^ k) >>> 0;
  h = rotl32(h, 13);
  return (Math.imul(h, 5) + 0xe6546b64) >>> 0;
}

function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** 32 pseudo-random bits from (seed, keyHi, keyLo, counterHi, counterLo). */
export function hash32(seed: number, a: number, b: number, c: number, d: number): number {
  let h = seed >>> 0;
  h = mixWord(h, a);
  h = mixWord(h, b);
  h = mixWord(h, c);
  h = mixWord(h, d);
  h = (h ^ 16) >>> 0;
  return fmix32(h);
}

/** One independent stream. Its only state is the counter. */
export class RngStream {
  /** Number of 32-bit values drawn so far. */
  counter = 0;
  readonly seed: number;
  readonly keyHi: number;
  readonly keyLo: number;

  constructor(seed: number, keyHi: number, keyLo: number) {
    this.seed = seed;
    this.keyHi = keyHi;
    this.keyLo = keyLo;
  }

  /** Next unsigned 32-bit integer. */
  nextU32(): number {
    const c = this.counter;
    this.counter = c + 1;
    // counter is a safe integer; split into two 32-bit words
    const cLo = c >>> 0;
    const cHi = Math.floor(c / 4294967296) >>> 0;
    return hash32(this.seed, this.keyHi, this.keyLo, cHi, cLo);
  }

  /** Uniform double in [0, 1) with 53 random bits. */
  next(): number {
    const a = this.nextU32() >>> 5;
    const b = this.nextU32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }

  /** Uniform double in [lo, hi). */
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }

  /** Uniform integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Standard normal by Box-Muller (uses the sim's own dmath; see normal.ts if needed). */
  sign(): number {
    return this.nextU32() & 1 ? 1 : -1;
  }
}

/** Serialised form of the generator: seed and sorted stream counters. */
export interface RngState {
  seed: number;
  streams: Array<[key: string, counter: number]>;
}

/** Keyed stream factory. One per simulation. */
export class Rng {
  private readonly streams = new Map<string, RngStream>();
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * The stream for a cause, for example rng.stream("fracture", entityId, tick).
   * Creating a stream has no effect on any other stream.
   */
  stream(cause: string, ...ids: number[]): RngStream {
    let key = cause;
    for (const id of ids) key += ':' + String(id);
    let s = this.streams.get(key);
    if (s === undefined) {
      const [hi, lo] = new Fnv1a64().str(key).words();
      s = new RngStream(this.seed, hi, lo);
      this.streams.set(key, s);
    }
    return s;
  }

  serialise(): RngState {
    const entries: Array<[string, number]> = [];
    for (const [k, s] of this.streams) entries.push([k, s.counter]);
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return { seed: this.seed, streams: entries };
  }

  static deserialise(state: RngState): Rng {
    const rng = new Rng(state.seed);
    for (const [key, counter] of state.streams) {
      const [hi, lo] = new Fnv1a64().str(key).words();
      const s = new RngStream(state.seed, hi, lo);
      s.counter = counter;
      rng.streams.set(key, s);
    }
    return rng;
  }

  /** Feed every stream counter into a hasher in sorted order. */
  hashInto(h: Fnv1a64): void {
    for (const [k, c] of this.serialise().streams) h.str(k).f64(c);
  }
}
