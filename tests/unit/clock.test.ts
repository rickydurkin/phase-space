import { describe, it, expect } from 'vitest';
import { FrameClock } from '../../src/sim/core/clock.ts';

const dt = 1 / 120;

function ticksOverOneSecond(fps: number, scale: number): { ticks: number; dropped: number } {
  const c = new FrameClock(dt);
  let ticks = 0;
  let dropped = 0;
  for (let i = 0; i < fps; i++) {
    const s = c.advance(1 / fps, scale);
    ticks += s.ticks;
    dropped += s.droppedSeconds;
  }
  return { ticks, dropped };
}

describe('frame clock', () => {
  it('runs 120 ticks per simulated second at any frame rate', () => {
    for (const fps of [30, 60, 120, 144]) {
      const r = ticksOverOneSecond(fps, 1);
      expect(r.ticks).toBeGreaterThanOrEqual(119);
      expect(r.ticks).toBeLessThanOrEqual(120);
      expect(r.dropped).toBe(0);
    }
  });

  it('the time scale changes the tick count, never the tick length', () => {
    expect(ticksOverOneSecond(60, 0.5).ticks).toBe(60);
    expect(ticksOverOneSecond(60, 2).ticks).toBe(240);
    expect(ticksOverOneSecond(60, 0.01).ticks).toBeLessThanOrEqual(2);
  });

  it('drops time beyond 48 ticks per frame and flags it', () => {
    const c = new FrameClock(dt, 48);
    const s = c.advance(1 / 30, 100); // wants 400 ticks
    expect(s.ticks).toBe(48);
    expect(s.belowRealTime).toBe(true);
    expect(s.droppedSeconds).toBeCloseTo((400 - 48) * dt, 9);
    expect(c.achievedRate).toBeLessThan(1);
  });

  it('keeps the interpolation fraction in [0, 1)', () => {
    const c = new FrameClock(dt);
    for (let i = 0; i < 1000; i++) {
      const s = c.advance(0.0137, 1);
      expect(s.alpha).toBeGreaterThanOrEqual(0);
      expect(s.alpha).toBeLessThan(1);
    }
  });
});
