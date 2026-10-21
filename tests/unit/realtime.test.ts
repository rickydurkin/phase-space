import { describe, it, expect } from 'vitest';
import { RealTimeMonitor } from '../../src/app/realtime.ts';

const DT = 1 / 120;
const FRAME = 1 / 60;

/** Feed `seconds` of 60 Hz frames where the simulation achieves `fraction` of the requested rate, in whole ticks. */
function run(m: RealTimeMonitor, seconds: number, timeScale: number, fraction: number, active = true): void {
  let owedTicks = 0;
  for (let t = 0; t < seconds; t += FRAME) {
    owedTicks += (FRAME * timeScale * fraction) / DT;
    const ticks = Math.floor(owedTicks);
    owedTicks -= ticks;
    m.push(FRAME, ticks * DT, timeScale, active);
  }
}

describe('RealTimeMonitor (D-009)', () => {
  it('stays quiet when the simulation keeps up', () => {
    const m = new RealTimeMonitor();
    run(m, 5, 1, 1);
    expect(m.belowRealTime).toBe(false);
    expect(m.achievedRatio).toBeGreaterThan(0.97);
  });

  it('flags a simulation running at 31% of real time and reports the rate', () => {
    const m = new RealTimeMonitor();
    run(m, 3, 1, 0.31);
    expect(m.belowRealTime).toBe(true);
    expect(m.achievedRatio).toBeGreaterThan(0.28);
    expect(m.achievedRatio).toBeLessThan(0.34);
  });

  it('flags a fast time scale the simulation cannot reach', () => {
    const m = new RealTimeMonitor();
    run(m, 3, 30, 0.2);
    expect(m.belowRealTime).toBe(true);
  });

  it('has hysteresis: 93% keeps the flag on, 99% clears it', () => {
    const m = new RealTimeMonitor();
    run(m, 2, 1, 0.5);
    expect(m.belowRealTime).toBe(true);
    run(m, 3, 1, 0.93);
    expect(m.belowRealTime).toBe(true);
    run(m, 3, 1, 0.995);
    expect(m.belowRealTime).toBe(false);
  });

  it('pausing, replaying or a long gap restarts the window without a false alarm', () => {
    const m = new RealTimeMonitor();
    run(m, 2, 1, 0.5);
    expect(m.belowRealTime).toBe(true);
    run(m, 1, 1, 0, false); // paused: no simulated time, but inactive
    expect(m.belowRealTime).toBe(false);
    m.push(5, 0, 1, true); // a 5 s gap (hidden tab)
    expect(m.belowRealTime).toBe(false);
  });

  it('does not misjudge slow motion at 1/100x, where whole ticks arrive rarely', () => {
    const m = new RealTimeMonitor();
    run(m, 40, 0.01, 1);
    expect(m.belowRealTime).toBe(false);
  });

  it('negative control: the same slow motion at 50% of the requested rate is flagged', () => {
    const m = new RealTimeMonitor();
    run(m, 40, 0.01, 0.5);
    expect(m.belowRealTime).toBe(true);
  });
});
