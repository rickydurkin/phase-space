// Frame clock: turns wall-clock frame deltas and the time scale into a whole
// number of fixed ticks (MASTER 5.3). The time scale never changes dt. When
// the budget of ticks per frame is exceeded, time is dropped, not stretched,
// and the caller shows "running below real time".
//
// This lives outside the authoritative state: replays are a function of the
// input log and tick count only, so frame pacing cannot change a result.

export interface ClockStep {
  /** Ticks to run this frame. */
  ticks: number;
  /** Simulated seconds dropped this frame because of the budget. */
  droppedSeconds: number;
  /** True when ticks were dropped. */
  belowRealTime: boolean;
  /** Fraction of a tick left in the accumulator, for render interpolation (0 to 1). */
  alpha: number;
}

export class FrameClock {
  readonly dt: number;
  readonly maxTicksPerFrame: number;
  private accumulator = 0;
  /** Running estimate of the achieved rate (simulated seconds per wall second). */
  achievedRate = 1;

  constructor(dt: number, maxTicksPerFrame = 48) {
    this.dt = dt;
    this.maxTicksPerFrame = maxTicksPerFrame;
  }

  reset(): void {
    this.accumulator = 0;
    this.achievedRate = 1;
  }

  /** Advance by a real frame delta (seconds, already clamped by the caller) at a time scale. */
  advance(frameSeconds: number, timeScale: number): ClockStep {
    const wanted = frameSeconds * timeScale;
    this.accumulator += wanted;
    let ticks = Math.floor(this.accumulator / this.dt);
    let dropped = 0;
    if (ticks > this.maxTicksPerFrame) {
      dropped = (ticks - this.maxTicksPerFrame) * this.dt;
      ticks = this.maxTicksPerFrame;
      this.accumulator -= dropped;
    }
    this.accumulator -= ticks * this.dt;
    // Keep the accumulator in [0, dt) against floating-point drift.
    if (this.accumulator < 0) this.accumulator = 0;
    if (this.accumulator >= this.dt) this.accumulator = this.dt - 1e-12;
    const achieved = wanted > 0 ? (wanted - dropped) / wanted : 1;
    this.achievedRate = this.achievedRate * 0.9 + achieved * 0.1;
    return {
      ticks,
      droppedSeconds: dropped,
      belowRealTime: dropped > 0,
      alpha: this.accumulator / this.dt,
    };
  }
}
