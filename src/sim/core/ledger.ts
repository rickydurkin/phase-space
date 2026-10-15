// The energy ledger (MASTER 5.7). Each domain reports its stores and booked
// transfers every tick. The ledger watches a sliding window and raises
// "energy created" when unexplained creation exceeds the larger of 0.5% of
// the gross energy moved between stores and 1 J, over any 10 s window.
//
// P0 scope: stores, booked transfers, the window check and the alarm, plus
// the negative control that proves the alarm can fire. The solver-residual
// budget and contact-loss booking arrive with the P1 mechanics benches.

import type { Fnv1a64 } from './hash.ts';
import { ByteWriter, ByteReader } from './bytes.ts';

export type StoreName =
  | 'kinetic'
  | 'gravitational'
  | 'elastic'
  | 'thermal'
  | 'latent'
  | 'chemical'
  | 'electrical'
  | 'field'
  | 'radiant'
  | 'acoustic';

export const STORE_NAMES: readonly StoreName[] = [
  'kinetic',
  'gravitational',
  'elastic',
  'thermal',
  'latent',
  'chemical',
  'electrical',
  'field',
  'radiant',
  'acoustic',
];

export interface LedgerFrame {
  tick: number;
  total: number;
  /** Energy that entered from outside the stores this tick (player work, sunlight...). */
  externalIn: number;
  /** Energy booked as lost to the environment this tick (friction heat not yet modelled, damping...). */
  bookedLoss: number;
  /** Gross energy moved between stores this tick (sum of absolute store changes / 2). */
  grossMoved: number;
}

export interface LedgerStatus {
  total: number;
  stores: Record<StoreName, number>;
  /** Unexplained creation over the window, J (positive means energy appeared). */
  unexplained: number;
  grossMovedWindow: number;
  threshold: number;
  alarm: boolean;
  /** Cause ids of the largest booked transfers in the window, newest first. */
  causes: string[];
}

export class EnergyLedger {
  readonly windowTicks: number;
  private readonly stores: Record<StoreName, number>;
  private readonly prev: Record<StoreName, number>;
  private externalIn = 0;
  private bookedLoss = 0;
  private readonly causes: string[] = [];
  private readonly frames: LedgerFrame[] = [];
  private started = false;
  private alarmLatched = false;

  constructor(dt: number, windowSeconds = 10) {
    this.windowTicks = Math.max(1, Math.round(windowSeconds / dt));
    this.stores = EnergyLedger.zeroStores();
    this.prev = EnergyLedger.zeroStores();
  }

  static zeroStores(): Record<StoreName, number> {
    const s = {} as Record<StoreName, number>;
    for (const n of STORE_NAMES) s[n] = 0;
    return s;
  }

  /** A domain reports the current value of one store (absolute, J). */
  report(store: StoreName, joules: number): void {
    this.stores[store] += joules;
  }

  /** Book energy entering from outside (positive) with a cause id. */
  bookExternal(joules: number, cause: string): void {
    this.externalIn += joules;
    this.pushCause(cause);
  }

  /** Book energy leaving to the environment (positive magnitude) with a cause id. */
  bookLoss(joules: number, cause: string): void {
    this.bookedLoss += joules;
    this.pushCause(cause);
  }

  private pushCause(cause: string): void {
    this.causes.unshift(cause);
    if (this.causes.length > 16) this.causes.length = 16;
  }

  /** Called by the scheduler before domains report, each tick. */
  beginTick(): void {
    for (const n of STORE_NAMES) {
      this.prev[n] = this.stores[n];
      this.stores[n] = 0;
    }
    this.externalIn = 0;
    this.bookedLoss = 0;
  }

  /** Called by the scheduler after every domain has reported. */
  endTick(tick: number): void {
    let total = 0;
    let gross = 0;
    for (const n of STORE_NAMES) {
      total += this.stores[n];
      gross += Math.abs(this.stores[n] - this.prev[n]);
    }
    if (!this.started) {
      // First frame establishes the baseline; no change to judge yet.
      this.started = true;
      this.frames.push({ tick, total, externalIn: 0, bookedLoss: 0, grossMoved: 0 });
      return;
    }
    this.frames.push({
      tick,
      total,
      externalIn: this.externalIn,
      bookedLoss: this.bookedLoss,
      grossMoved: gross * 0.5,
    });
    while (this.frames.length > this.windowTicks + 1) this.frames.shift();
    if (this.status().alarm) this.alarmLatched = true;
  }

  /** Window check: creation = dTotal - externalIn + bookedLoss, judged against gross moved. */
  status(): LedgerStatus {
    const first = this.frames[0];
    const last = this.frames[this.frames.length - 1];
    let externalIn = 0;
    let bookedLoss = 0;
    let gross = 0;
    for (let i = 1; i < this.frames.length; i++) {
      const f = this.frames[i] as LedgerFrame;
      externalIn += f.externalIn;
      bookedLoss += f.bookedLoss;
      gross += f.grossMoved;
    }
    const dTotal = first !== undefined && last !== undefined ? last.total - first.total : 0;
    const unexplained = dTotal - externalIn + bookedLoss;
    const threshold = Math.max(0.005 * gross, 1);
    return {
      total: last?.total ?? 0,
      stores: { ...this.stores },
      unexplained,
      grossMovedWindow: gross,
      threshold,
      alarm: unexplained > threshold,
      causes: [...this.causes],
    };
  }

  /** True once the alarm has fired at any point in the run (mission evaluation uses this). */
  get alarmed(): boolean {
    return this.alarmLatched;
  }

  hashInto(h: Fnv1a64): void {
    for (const n of STORE_NAMES) h.f64(this.stores[n]);
    h.u32(this.frames.length);
    const last = this.frames[this.frames.length - 1];
    if (last !== undefined) h.f64(last.total);
    h.u32(this.alarmLatched ? 1 : 0);
  }

  /** Serialise the window (binary) so a restored run continues with the same judgement. */
  serialise(): Uint8Array {
    const w = new ByteWriter(64 * 1024);
    for (const n of STORE_NAMES) w.f64(this.stores[n]);
    for (const n of STORE_NAMES) w.f64(this.prev[n]);
    w.u32(this.started ? 1 : 0).u32(this.alarmLatched ? 1 : 0);
    w.u32(this.frames.length);
    for (const f of this.frames) w.u32(f.tick).f64(f.total).f64(f.externalIn).f64(f.bookedLoss).f64(f.grossMoved);
    w.u32(this.causes.length);
    for (const c of this.causes) w.str(c);
    return w.finish();
  }

  deserialise(bytes: Uint8Array): void {
    const r = new ByteReader(bytes);
    for (const n of STORE_NAMES) this.stores[n] = r.f64();
    for (const n of STORE_NAMES) this.prev[n] = r.f64();
    this.started = r.u32() === 1;
    this.alarmLatched = r.u32() === 1;
    const n = r.u32();
    this.frames.length = 0;
    for (let i = 0; i < n; i++) {
      this.frames.push({ tick: r.u32(), total: r.f64(), externalIn: r.f64(), bookedLoss: r.f64(), grossMoved: r.f64() });
    }
    const nc = r.u32();
    this.causes.length = 0;
    for (let i = 0; i < nc; i++) this.causes.push(r.str());
  }
}
