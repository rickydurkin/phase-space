// The observation bus (MASTER 9): domains publish typed quantities with units;
// instruments only ever read from here and never compute physics themselves.

export type Tag = 'computed' | 'anchored' | 'estimated';

export interface Observation {
  /** Dotted path, for example "mechanics.energy.kinetic" or "body.3.height". */
  readonly key: string;
  readonly value: number;
  readonly unit: string;
  readonly tag: Tag;
}

export interface ObservationSink {
  publish(key: string, value: number, unit: string, tag?: Tag): void;
}

/** Collects one tick's observations into a map. */
export class ObservationCollector implements ObservationSink {
  readonly values = new Map<string, Observation>();

  publish(key: string, value: number, unit: string, tag: Tag = 'computed'): void {
    this.values.set(key, { key, value, unit, tag });
  }

  get(key: string): number | undefined {
    return this.values.get(key)?.value;
  }

  clear(): void {
    this.values.clear();
  }

  /** Flat snapshot for transfer to the main thread. */
  toArray(): Observation[] {
    return [...this.values.values()];
  }
}
