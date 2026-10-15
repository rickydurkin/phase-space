// Typed event bus. Events are produced during a tick in a fixed order and
// consumed by observers and other domains before the tick ends.

export interface SimEvent {
  readonly type: string;
  readonly tick: number;
  /** Cause id for the energy ledger and debugging, for example "contact:3:7". */
  readonly cause: string;
  readonly data: Readonly<Record<string, number>>;
}

export class EventBus {
  private events: SimEvent[] = [];

  emit(e: SimEvent): void {
    this.events.push(e);
  }

  /** Events of this tick so far, in emission order. */
  current(): readonly SimEvent[] {
    return this.events;
  }

  /** Called by the scheduler at the end of each tick. */
  clear(): void {
    this.events = [];
  }
}
