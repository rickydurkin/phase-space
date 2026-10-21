// "Running below real time" detection on the main thread (MASTER 2.8, 5.3; D-009).
//
// The worker's frame clock flags dropped time only when one frame needs more
// than 48 ticks. When the AS is simply slower than the wall clock, frames take
// longer, the main thread caps the time it hands over per round trip, and time
// is lost without that flag. This monitor compares simulated time advanced with
// wall time times the requested time scale over a sliding window, so any cause
// of lost time shows up. It reads the simulation's output; it never feeds it.

interface Sample {
  readonly wall: number;
  readonly sim: number;
  readonly wanted: number;
}

/** Below this fraction of the requested rate the badge appears. */
const BELOW = 0.9;
/** Above this fraction it clears again (hysteresis, so the badge does not flicker). */
const CLEAR = 0.97;
/** Judge over at least this much wall time... */
const MIN_WALL_SECONDS = 1;
/** ...and at least this much requested simulated time (30 ticks at 120 Hz), so slow motion is not misjudged by tick rounding. */
const MIN_WANTED_SECONDS = 0.25;
/** Longest window kept, for very slow time scales. */
const MAX_WALL_SECONDS = 30;
/** A single gap longer than this (tab hidden, debugger) starts the window again. */
const MAX_GAP_SECONDS = 1;

export class RealTimeMonitor {
  private readonly samples: Sample[] = [];
  private below = false;
  private ratio = 1;
  private judged = false;

  /**
   * Feed elapsed wall time and simulated time since the previous call.
   * `active` is false while paused, replaying, hidden or stopped: the window restarts.
   */
  push(wallSeconds: number, simSeconds: number, timeScale: number, active: boolean): void {
    if (!active || !(wallSeconds > 0) || wallSeconds > MAX_GAP_SECONDS || simSeconds < 0 || !(timeScale > 0)) {
      this.reset();
      return;
    }
    this.samples.push({ wall: wallSeconds, sim: simSeconds, wanted: wallSeconds * timeScale });
    let wall = 0;
    let sim = 0;
    let wanted = 0;
    for (const s of this.samples) {
      wall += s.wall;
      sim += s.sim;
      wanted += s.wanted;
    }
    // Drop the oldest samples while the window stays long enough without them.
    while (this.samples.length > 1) {
      const oldest = this.samples[0] as Sample;
      const longEnough = wall - oldest.wall >= MIN_WALL_SECONDS && wanted - oldest.wanted >= MIN_WANTED_SECONDS;
      if (!longEnough && wall <= MAX_WALL_SECONDS) break;
      this.samples.shift();
      wall -= oldest.wall;
      sim -= oldest.sim;
      wanted -= oldest.wanted;
    }
    if (wall < MIN_WALL_SECONDS || wanted < MIN_WANTED_SECONDS) return; // not enough evidence yet
    this.ratio = sim / wanted;
    this.judged = true;
    if (!this.below && this.ratio < BELOW) this.below = true;
    else if (this.below && this.ratio > CLEAR) this.below = false;
  }

  reset(): void {
    this.samples.length = 0;
    this.below = false;
    this.ratio = 1;
    this.judged = false;
  }

  /** True while the simulation runs measurably slower than requested. */
  get belowRealTime(): boolean {
    return this.below;
  }

  /** True once enough evidence has been seen to state an achieved rate. */
  get hasEstimate(): boolean {
    return this.judged;
  }

  /** Simulated seconds achieved per simulated second requested, over the window (1 = keeping up). */
  get achievedRatio(): number {
    return this.ratio;
  }
}
