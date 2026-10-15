import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/sim/rng/index.ts';

describe('keyed RNG streams', () => {
  it('is reproducible from the seed and stream key', () => {
    const a = new Rng(42).stream('fracture', 7, 100);
    const b = new Rng(42).stream('fracture', 7, 100);
    const xs = Array.from({ length: 8 }, () => a.next());
    const ys = Array.from({ length: 8 }, () => b.next());
    expect(xs).toEqual(ys);
    expect(new Set(xs).size).toBe(8);
  });

  it('streams are independent: creating or using one does not shift another', () => {
    const r1 = new Rng(1);
    const wind = r1.stream('wind');
    const before = [wind.next(), wind.next(), wind.next()];
    const r2 = new Rng(1);
    r2.stream('fracture', 3).next();
    r2.stream('spray').next();
    const wind2 = r2.stream('wind');
    expect([wind2.next(), wind2.next(), wind2.next()]).toEqual(before);
  });

  it('different seeds and keys give different sequences', () => {
    expect(new Rng(1).stream('a').next()).not.toBe(new Rng(2).stream('a').next());
    expect(new Rng(1).stream('a').next()).not.toBe(new Rng(1).stream('b').next());
    expect(new Rng(1).stream('a', 1).next()).not.toBe(new Rng(1).stream('a', 2).next());
  });

  it('serialises and restores every stream counter', () => {
    const r = new Rng(9);
    r.stream('x').next();
    r.stream('y', 2).next();
    r.stream('y', 2).next();
    const state = r.serialise();
    expect(state.streams).toEqual([
      ['x', 2],
      ['y:2', 4],
    ]);
    const q = Rng.deserialise(state);
    expect(q.stream('x').next()).toBe(r.stream('x').next());
    expect(q.stream('y', 2).next()).toBe(r.stream('y', 2).next());
  });

  it('is roughly uniform on [0, 1)', () => {
    const s = new Rng(3).stream('uniform');
    const bins = new Array<number>(10).fill(0);
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const x = s.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      bins[Math.floor(x * 10)] = (bins[Math.floor(x * 10)] as number) + 1;
    }
    for (const b of bins) expect(Math.abs(b / n - 0.1)).toBeLessThan(0.01);
  });
});
