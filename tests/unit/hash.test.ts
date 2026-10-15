import { describe, it, expect } from 'vitest';
import { Fnv1a64, fnv1a64Hex } from '../../src/sim/core/hash.ts';

describe('FNV-1a 64', () => {
  it('matches the published test vectors', () => {
    // Vectors from the FNV reference implementation (Landon Curt Noll).
    expect(new Fnv1a64().hex()).toBe('cbf29ce484222325');
    expect(new Fnv1a64().byte(0x61).hex()).toBe('af63dc4c8601ec8c'); // "a"
    const foobar = new Fnv1a64();
    for (const c of 'foobar') foobar.byte(c.charCodeAt(0));
    expect(foobar.hex()).toBe('85944171f73967e8');
  });

  it('distinguishes +0 and -0 and is order sensitive', () => {
    expect(new Fnv1a64().f64(0).hex()).not.toBe(new Fnv1a64().f64(-0).hex());
    expect(new Fnv1a64().f64(1).f64(2).hex()).not.toBe(new Fnv1a64().f64(2).f64(1).hex());
    expect(fnv1a64Hex('abc')).toBe(fnv1a64Hex('abc'));
    expect(fnv1a64Hex('abc')).not.toBe(fnv1a64Hex('abd'));
  });
});
