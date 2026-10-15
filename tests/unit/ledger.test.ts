import { describe, it, expect } from 'vitest';
import { EnergyLedger } from '../../src/sim/core/ledger.ts';

const dt = 1 / 120;

function run(ledger: EnergyLedger, ticks: number, report: (tick: number, l: EnergyLedger) => void): void {
  for (let t = 0; t < ticks; t++) {
    ledger.beginTick();
    report(t, ledger);
    ledger.endTick(t);
  }
}

describe('energy ledger', () => {
  it('stays quiet when energy only moves between stores', () => {
    const l = new EnergyLedger(dt);
    const total = 5000; // J, a 2 m drop of a 255 kg body
    run(l, 1200, (t, led) => {
      const frac = Math.min(1, t / 240);
      led.report('kinetic', total * frac);
      led.report('gravitational', total * (1 - frac));
    });
    const s = l.status();
    expect(s.alarm).toBe(false);
    expect(Math.abs(s.unexplained)).toBeLessThan(1e-6);
    expect(s.grossMovedWindow).toBeGreaterThan(total * 0.9);
  });

  it('stays quiet when a loss is booked', () => {
    const l = new EnergyLedger(dt);
    run(l, 600, (t, led) => {
      const e = 1000 - t; // 1 J per tick leaks away
      led.report('kinetic', e);
      if (t > 0) led.bookLoss(1, 'friction:test');
    });
    expect(l.status().alarm).toBe(false);
    expect(l.alarmed).toBe(false);
  });

  it('negative control, quiet scene: unbooked energy of 2% of the gross moved (at least 2 J) trips the alarm', () => {
    const l = new EnergyLedger(dt);
    const gross = 50; // J moved over the window
    run(l, 1200, (t, led) => {
      const frac = Math.min(1, t / 1200);
      // energy moves gravitational -> kinetic, plus 2 J appears from nowhere spread over the window
      led.report('kinetic', gross * frac + 2 * frac);
      led.report('gravitational', gross * (1 - frac));
    });
    const s = l.status();
    expect(s.threshold).toBe(1); // 0.5% of 50 J is below the 1 J floor
    expect(s.unexplained).toBeGreaterThan(1.9);
    expect(s.alarm).toBe(true);
    expect(l.alarmed).toBe(true);
  });

  it('negative control, busy scene: 2% of a large gross trips the alarm, 0.1% does not', () => {
    const gross = 100_000;
    const trip = new EnergyLedger(dt);
    run(trip, 1200, (t, led) => {
      const frac = Math.min(1, t / 1200);
      led.report('kinetic', gross * frac + 0.02 * gross * frac);
      led.report('gravitational', gross * (1 - frac));
    });
    expect(trip.status().alarm).toBe(true);
    const fine = new EnergyLedger(dt);
    run(fine, 1200, (t, led) => {
      const frac = Math.min(1, t / 1200);
      led.report('kinetic', gross * frac + 0.001 * gross * frac);
      led.report('gravitational', gross * (1 - frac));
    });
    expect(fine.status().alarm).toBe(false);
  });

  it('a booked external input explains the gain', () => {
    const l = new EnergyLedger(dt);
    run(l, 600, (t, led) => {
      led.report('kinetic', t * 0.5);
      if (t > 0) led.bookExternal(0.5, 'player:push');
    });
    expect(l.status().alarm).toBe(false);
    expect(l.status().causes[0]).toBe('player:push');
  });

  it('serialises and restores the window', () => {
    const l = new EnergyLedger(dt);
    run(l, 300, (t, led) => led.report('kinetic', t));
    const bytes = l.serialise();
    const m = new EnergyLedger(dt);
    m.deserialise(bytes);
    expect(m.status()).toEqual(l.status());
  });
});
