// Shared simulation interfaces (MASTER 5.9).

import type { World, EntityId } from './world.ts';
import type { EventBus } from './events.ts';
import type { ObservationSink } from './observe.ts';
import type { EnergyLedger } from './ledger.ts';
import type { Rng } from '../rng/index.ts';

export interface StepContext {
  readonly tick: number;
  /** Simulated time at the start of this tick, s. */
  readonly time: number;
  readonly events: EventBus;
  readonly ledger: EnergyLedger;
  readonly rng: Rng;
}

export interface DomainConfig {
  /** Tick length, s. */
  readonly dt: number;
  readonly gravity: readonly [number, number, number];
  /** Mechanics substeps per tick (MASTER 5.3). */
  readonly mechanicsSubsteps: number;
}

export interface BenchResult {
  readonly id: string;
  readonly name: string;
  readonly expected: number;
  readonly measured: number;
  readonly tolerance: number;
  readonly pass: boolean;
}

export type RealityBadge = 'Real' | 'Plausible' | 'Exaggerated' | 'Impossible';

export interface ModelCard {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly badge: RealityBadge;
  /** Player-facing summary, at most 60 words, en-GB. */
  readonly summary: string;
  readonly benches: readonly string[];
}

export interface DomainModule {
  readonly name: string;
  init(world: World, config: DomainConfig): void;
  step(world: World, dt: number, ctx: StepContext): void;
  observe(world: World, sink: ObservationSink): void;
  serialise(): Uint8Array;
  deserialise(bytes: Uint8Array): void;
  validate(): BenchResult[];
  modelCards(): ModelCard[];
}

/** Input commands are the only way the outside world changes AS state. */
export type InputCommand =
  | { readonly type: 'impulse'; readonly tick: number; readonly entity: EntityId; readonly ix: number; readonly iy: number; readonly iz: number }
  | { readonly type: 'nudge'; readonly tick: number; readonly entity: EntityId; readonly dx: number; readonly dy: number; readonly dz: number }
  | { readonly type: 'wake'; readonly tick: number; readonly entity: EntityId };
