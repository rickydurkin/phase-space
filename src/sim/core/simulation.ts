// The Authoritative Simulation: fixed tick, documented order, input log,
// snapshots and the state hash (MASTER 5.3 to 5.5). Everything that decides
// an outcome happens here, on the CPU, with no wall clock.

import { World, Pose, Velocity, RigidBody } from './world.ts';
import type { EntityId } from './world.ts';
import { Rng } from '../rng/index.ts';
import { EventBus } from './events.ts';
import { EnergyLedger } from './ledger.ts';
import { ObservationCollector } from './observe.ts';
import { Fnv1a64 } from './hash.ts';
import { ByteWriter, ByteReader } from './bytes.ts';
import type { DomainModule, DomainConfig, InputCommand, StepContext } from './types.ts';
import type { SceneDef } from '../scenes/types.ts';
import { RapierMechanics, initRapier } from '../domains/mechanics/rapier.ts';
import { SNAPSHOT_FORMAT } from '../version.ts';

export const DEFAULT_DT = 1 / 120;
export const DEFAULT_MECHANICS_SUBSTEPS = 2;

export interface SimulationOptions {
  readonly seed: number;
  /** Override the scene's tick (tests only; replays record the value used). */
  readonly dt?: number;
}

export interface SimulationInfo {
  readonly sceneId: string;
  readonly sceneVersion: number;
  readonly seed: number;
  readonly dt: number;
  readonly mechanicsSubsteps: number;
}

export class Simulation {
  readonly info: SimulationInfo;
  readonly world: World;
  readonly rng: Rng;
  readonly events = new EventBus();
  readonly ledger: EnergyLedger;
  readonly observations = new ObservationCollector();
  readonly mechanics: RapierMechanics;
  /** Domains in schedule order (docs/architecture/SCHEDULE.md). */
  readonly domains: DomainModule[];
  /** Every input ever queued, in queue order. Replays are seed plus this log. */
  private readonly inputLog: InputCommand[] = [];
  private inputCursor = 0;
  private tickCount = 0;
  /** Entity ids by body name, from the scene definition. */
  readonly named: ReadonlyMap<string, EntityId>;

  private constructor(scene: SceneDef, options: SimulationOptions) {
    const dt = options.dt ?? scene.dt ?? DEFAULT_DT;
    const substeps = scene.mechanicsSubsteps ?? DEFAULT_MECHANICS_SUBSTEPS;
    this.info = {
      sceneId: scene.id,
      sceneVersion: scene.version,
      seed: options.seed,
      dt,
      mechanicsSubsteps: substeps,
    };
    this.world = new World();
    this.rng = new Rng(options.seed);
    this.ledger = new EnergyLedger(dt);
    const named = new Map<string, EntityId>();
    const pose = this.world.store(Pose);
    const vel = this.world.store(Velocity);
    const rb = this.world.store(RigidBody);
    for (const b of scene.bodies) {
      const id = this.world.createEntity();
      named.set(b.name, id);
      this.world.add(id, Pose);
      this.world.add(id, RigidBody);
      pose.field('px')[id] = b.position[0];
      pose.field('py')[id] = b.position[1];
      pose.field('pz')[id] = b.position[2];
      const q = b.rotation ?? [0, 0, 0, 1];
      pose.field('qx')[id] = q[0];
      pose.field('qy')[id] = q[1];
      pose.field('qz')[id] = q[2];
      pose.field('qw')[id] = q[3];
      rb.field('kind')[id] = b.kind === 'dynamic' ? 1 : 0;
      rb.field('shape')[id] = b.shape === 'ball' ? 1 : 0;
      if (b.shape === 'ball') {
        rb.field('hx')[id] = b.radius ?? 0.5;
      } else {
        const h = b.halfExtents ?? [0.5, 0.5, 0.5];
        rb.field('hx')[id] = h[0];
        rb.field('hy')[id] = h[1];
        rb.field('hz')[id] = h[2];
      }
      rb.field('density')[id] = b.density ?? 1000;
      rb.field('friction')[id] = b.friction ?? 0.5;
      rb.field('restitution')[id] = b.restitution ?? 0;
      if (b.kind === 'dynamic') {
        this.world.add(id, Velocity);
        const lv = b.linvel ?? [0, 0, 0];
        const av = b.angvel ?? [0, 0, 0];
        vel.field('vx')[id] = lv[0];
        vel.field('vy')[id] = lv[1];
        vel.field('vz')[id] = lv[2];
        vel.field('wx')[id] = av[0];
        vel.field('wy')[id] = av[1];
        vel.field('wz')[id] = av[2];
      }
    }
    this.named = named;
    this.mechanics = new RapierMechanics();
    this.domains = [this.mechanics];
    const config: DomainConfig = { dt, gravity: scene.gravity, mechanicsSubsteps: substeps };
    for (const d of this.domains) d.init(this.world, config);
  }

  /** Build a simulation for a scene. Async because Rapier's WebAssembly must be initialised. */
  static async create(scene: SceneDef, options: SimulationOptions): Promise<Simulation> {
    await initRapier();
    return new Simulation(scene, options);
  }

  get tick(): number {
    return this.tickCount;
  }

  /** Simulated time, s. */
  get time(): number {
    return this.tickCount * this.info.dt;
  }

  get inputs(): readonly InputCommand[] {
    return this.inputLog;
  }

  /** Queue an input for a future (or the current, not yet stepped) tick. */
  /**
   * Queue an input for a future (or the current, not yet stepped) tick. Inputs are
   * validated here, when they arrive, so a bad one is rejected to its sender and
   * never reaches the log, the replay file or a later step (D-005).
   */
  queueInput(cmd: InputCommand): void {
    if (!Number.isInteger(cmd.tick) || cmd.tick < 0) {
      throw new Error(`input tick must be a whole number of ticks, got ${String(cmd.tick)}`);
    }
    if (cmd.tick < this.tickCount) {
      throw new Error(`input for tick ${cmd.tick} arrived at tick ${this.tickCount}; rewind first`);
    }
    if (!Number.isInteger(cmd.entity) || !this.world.isAlive(cmd.entity) || !this.world.has(cmd.entity, RigidBody)) {
      throw new Error(`input targets unknown entity ${String(cmd.entity)}`);
    }
    let copy: InputCommand;
    switch (cmd.type) {
      case 'impulse':
        requireFinite(cmd.ix, cmd.iy, cmd.iz);
        copy = { type: 'impulse', tick: cmd.tick, entity: cmd.entity, ix: cmd.ix, iy: cmd.iy, iz: cmd.iz };
        break;
      case 'nudge':
        requireFinite(cmd.dx, cmd.dy, cmd.dz);
        copy = { type: 'nudge', tick: cmd.tick, entity: cmd.entity, dx: cmd.dx, dy: cmd.dy, dz: cmd.dz };
        break;
      case 'wake':
        copy = { type: 'wake', tick: cmd.tick, entity: cmd.entity };
        break;
      default:
        throw new Error(`unknown input type ${String((cmd as { type?: unknown }).type)}`);
    }
    // keep the log sorted by tick, stable for equal ticks
    let i = this.inputLog.length;
    while (i > this.inputCursor && (this.inputLog[i - 1] as InputCommand).tick > copy.tick) i--;
    this.inputLog.splice(i, 0, copy);
  }

  /** Release the physics engine's memory. The simulation cannot be used afterwards. */
  dispose(): void {
    this.mechanics.dispose();
  }

  /** Advance one tick in the documented order. */
  step(): void {
    const tick = this.tickCount;
    const ctx: StepContext = {
      tick,
      time: tick * this.info.dt,
      events: this.events,
      ledger: this.ledger,
      rng: this.rng,
    };
    // 1. inputs stamped for this tick
    while (this.inputCursor < this.inputLog.length) {
      const cmd = this.inputLog[this.inputCursor] as InputCommand;
      if (cmd.tick > tick) break;
      this.mechanics.applyInput(cmd);
      this.inputCursor++;
    }
    // 2. domains in schedule order; each reports its energy stores
    this.ledger.beginTick();
    for (const d of this.domains) d.step(this.world, this.info.dt, ctx);
    // 3. ledger judgement, then observers
    this.ledger.endTick(tick);
    this.events.clear();
    this.tickCount = tick + 1;
  }

  advance(ticks: number): void {
    for (let i = 0; i < ticks; i++) this.step();
  }

  /** Refresh the observation collector from every domain. */
  observe(): ObservationCollector {
    this.observations.clear();
    for (const d of this.domains) d.observe(this.world, this.observations);
    const s = this.ledger.status();
    this.observations.publish('ledger.total', s.total, 'J');
    this.observations.publish('ledger.unexplained', s.unexplained, 'J');
    this.observations.publish('ledger.alarm', s.alarm ? 1 : 0, '');
    return this.observations;
  }

  /** FNV-1a 64 over a canonical serialisation of the authoritative state. */
  hash(): string {
    const h = new Fnv1a64();
    h.u32(this.tickCount);
    this.world.hashInto(h);
    this.rng.hashInto(h);
    this.ledger.hashInto(h);
    return h.hex();
  }

  snapshot(): Uint8Array {
    const w = new ByteWriter(16384);
    w.u32(SNAPSHOT_FORMAT);
    w.u32(this.tickCount);
    w.bytes(this.world.serialise());
    w.u32(this.domains.length);
    for (const d of this.domains) w.str(d.name).bytes(d.serialise());
    w.str(JSON.stringify(this.rng.serialise()));
    w.bytes(this.ledger.serialise());
    w.u32(this.inputLog.length).u32(this.inputCursor);
    for (const cmd of this.inputLog) w.str(JSON.stringify(cmd));
    return w.finish();
  }

  restore(bytes: Uint8Array): void {
    const r = new ByteReader(bytes);
    const format = r.u32();
    if (format !== SNAPSHOT_FORMAT) throw new Error(`snapshot format ${format} not supported`);
    this.tickCount = r.u32();
    this.world.deserialise(r.bytes());
    const n = r.u32();
    for (let i = 0; i < n; i++) {
      const name = r.str();
      const blob = r.bytes();
      const d = this.domains.find((x) => x.name === name);
      if (d === undefined) throw new Error(`snapshot has unknown domain ${name}`);
      d.deserialise(blob);
    }
    const rngState = JSON.parse(r.str()) as ReturnType<Rng['serialise']>;
    const restoredRng = Rng.deserialise(rngState);
    // Rng is readonly on the class; copy stream state across through serialise/deserialise.
    (this as { rng: Rng }).rng = restoredRng;
    this.ledger.deserialise(r.bytes());
    const nInputs = r.u32();
    this.inputCursor = r.u32();
    this.inputLog.length = 0;
    for (let i = 0; i < nInputs; i++) this.inputLog.push(JSON.parse(r.str()) as InputCommand);
    this.events.clear();
  }
}

function requireFinite(...values: number[]): void {
  for (const v of values) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`input values must be finite numbers, got ${String(v)}`);
  }
}
