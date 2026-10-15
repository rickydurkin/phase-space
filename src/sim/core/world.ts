// The AS world: a deterministic entity registry with structure-of-arrays
// component stores. Entities have stable integer ids, are iterated in id
// order, and can be restored under their original ids (which is why this is
// not bitECS; see docs/adr/0002-entity-store.md).

import type { Fnv1a64 } from './hash.ts';
import { ByteWriter, ByteReader } from './bytes.ts';
import { SNAPSHOT_FORMAT } from '../version.ts';

export type EntityId = number;

export interface ComponentDef<F extends string = string> {
  readonly name: string;
  /** Bit index in the entity mask (0 to 31). */
  readonly bit: number;
  readonly fields: readonly F[];
}

export function defineComponent<const F extends string>(
  name: string,
  bit: number,
  fields: readonly F[],
): ComponentDef<F> {
  return { name, bit, fields };
}

/** SoA store: one Float64Array per field, indexed by entity id. */
export class ComponentStore<F extends string = string> {
  readonly def: ComponentDef<F>;
  readonly data: Record<F, Float64Array>;

  constructor(def: ComponentDef<F>, capacity: number) {
    this.def = def;
    const d = {} as Record<F, Float64Array>;
    for (const f of def.fields) d[f] = new Float64Array(capacity);
    this.data = d;
  }

  clear(id: EntityId): void {
    for (const f of this.def.fields) this.field(f)[id] = 0;
  }

  /** The typed array behind one field. */
  field(f: F): Float64Array {
    const a = this.data[f];
    if (a === undefined) throw new Error(`unknown field  on `);
    return a;
  }
}

// Components shared by every scene in P0. Domains may define more.
export const Pose = defineComponent('pose', 0, ['px', 'py', 'pz', 'qx', 'qy', 'qz', 'qw'] as const);
export const Velocity = defineComponent('velocity', 1, ['vx', 'vy', 'vz', 'wx', 'wy', 'wz'] as const);
export const RigidBody = defineComponent('rigidBody', 2, [
  'kind', // 0 fixed, 1 dynamic
  'shape', // 0 cuboid, 1 ball
  'hx', // half extent x, or radius for balls
  'hy',
  'hz',
  'density',
  'friction',
  'restitution',
  'mass', // written by the mechanics domain
  'sleeping', // 0 or 1, written by the mechanics domain
] as const);

export const CORE_COMPONENTS: ComponentDef[] = [Pose, Velocity, RigidBody];

export class World {
  readonly capacity: number;
  private readonly alive: Uint8Array;
  private readonly masks: Uint32Array;
  private readonly stores = new Map<string, ComponentStore>();
  private readonly storeList: ComponentStore[] = [];
  private nextId = 1; // 0 is reserved as "no entity"
  private readonly free: number[] = [];
  private count = 0;

  constructor(components: ComponentDef[] = CORE_COMPONENTS, capacity = 4096) {
    this.capacity = capacity;
    this.alive = new Uint8Array(capacity);
    this.masks = new Uint32Array(capacity);
    for (const c of components) this.register(c);
  }

  register(def: ComponentDef): void {
    if (this.stores.has(def.name)) throw new Error(`component already registered: ${def.name}`);
    for (const s of this.storeList) {
      if (s.def.bit === def.bit) throw new Error(`component bit ${def.bit} already used by ${s.def.name}`);
    }
    const store = new ComponentStore(def, this.capacity);
    this.stores.set(def.name, store);
    this.storeList.push(store);
    this.storeList.sort((a, b) => a.def.bit - b.def.bit);
  }

  store<F extends string>(def: ComponentDef<F>): ComponentStore<F> {
    const s = this.stores.get(def.name);
    if (s === undefined) throw new Error(`component not registered: ${def.name}`);
    return s as unknown as ComponentStore<F>;
  }

  get entityCount(): number {
    return this.count;
  }

  /** Smallest free id, else the next new id. Deterministic by construction. */
  createEntity(): EntityId {
    let id: number;
    if (this.free.length > 0) {
      // free list is kept sorted ascending; take the smallest
      id = this.free.shift() as number;
    } else {
      id = this.nextId++;
      if (id >= this.capacity) throw new Error(`world capacity ${this.capacity} exceeded`);
    }
    this.alive[id] = 1;
    this.masks[id] = 0;
    this.count++;
    return id;
  }

  destroyEntity(id: EntityId): void {
    if (this.alive[id] !== 1) throw new Error(`entity ${id} is not alive`);
    this.alive[id] = 0;
    this.masks[id] = 0;
    for (const s of this.storeList) s.clear(id);
    this.count--;
    // insert keeping ascending order
    let i = this.free.length;
    while (i > 0 && (this.free[i - 1] as number) > id) i--;
    this.free.splice(i, 0, id);
  }

  isAlive(id: EntityId): boolean {
    return this.alive[id] === 1;
  }

  add(id: EntityId, def: ComponentDef): void {
    if (this.alive[id] !== 1) throw new Error(`entity ${id} is not alive`);
    this.masks[id] = ((this.masks[id] as number) | (1 << def.bit)) >>> 0;
  }

  remove(id: EntityId, def: ComponentDef): void {
    this.masks[id] = ((this.masks[id] as number) & ~(1 << def.bit)) >>> 0;
    this.store(def).clear(id);
  }

  has(id: EntityId, def: ComponentDef): boolean {
    return ((this.masks[id] as number) & (1 << def.bit)) !== 0;
  }

  /** Alive entity ids in ascending order, optionally only those with every given component. */
  entities(...withAll: ComponentDef[]): EntityId[] {
    let need = 0;
    for (const d of withAll) need |= 1 << d.bit;
    const out: EntityId[] = [];
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] === 1 && ((this.masks[id] as number) & need) === need) out.push(id);
    }
    return out;
  }

  /** Canonical hash of every alive entity's components, in id order. */
  hashInto(h: Fnv1a64): void {
    h.u32(this.count);
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] !== 1) continue;
      h.u32(id).u32(this.masks[id] as number);
      for (const s of this.storeList) {
        if (((this.masks[id] as number) & (1 << s.def.bit)) === 0) continue;
        for (const f of s.def.fields) h.f64(s.field(f)[id] as number);
      }
    }
  }

  serialise(): Uint8Array {
    const w = new ByteWriter(4096);
    w.u32(SNAPSHOT_FORMAT).u32(this.capacity).u32(this.nextId).u32(this.count);
    w.u32(this.storeList.length);
    for (const s of this.storeList) w.str(s.def.name).u32(s.def.bit).u32(s.def.fields.length);
    for (let id = 1; id < this.nextId; id++) {
      if (this.alive[id] !== 1) continue;
      w.u32(id).u32(this.masks[id] as number);
      for (const s of this.storeList) {
        if (((this.masks[id] as number) & (1 << s.def.bit)) === 0) continue;
        for (const f of s.def.fields) w.f64(s.field(f)[id] as number);
      }
    }
    return w.finish();
  }

  /** Restore into this world (same component schema). Replaces all entities. */
  deserialise(bytes: Uint8Array): void {
    const r = new ByteReader(bytes);
    const format = r.u32();
    if (format !== SNAPSHOT_FORMAT) throw new Error(`snapshot format ${format} not supported`);
    const capacity = r.u32();
    if (capacity !== this.capacity) throw new Error(`snapshot capacity ${capacity} differs from ${this.capacity}`);
    const nextId = r.u32();
    const count = r.u32();
    const nStores = r.u32();
    if (nStores !== this.storeList.length) throw new Error('snapshot component schema differs');
    for (const s of this.storeList) {
      const name = r.str();
      const bit = r.u32();
      const nFields = r.u32();
      if (name !== s.def.name || bit !== s.def.bit || nFields !== s.def.fields.length) {
        throw new Error(`snapshot component ${name} differs from ${s.def.name}`);
      }
    }
    this.alive.fill(0);
    this.masks.fill(0);
    for (const s of this.storeList) for (const f of s.def.fields) s.field(f).fill(0);
    for (let i = 0; i < count; i++) {
      const id = r.u32();
      const mask = r.u32();
      this.alive[id] = 1;
      this.masks[id] = mask;
      for (const s of this.storeList) {
        if ((mask & (1 << s.def.bit)) === 0) continue;
        for (const f of s.def.fields) s.field(f)[id] = r.f64();
      }
    }
    this.nextId = nextId;
    this.count = count;
    this.free.length = 0;
    for (let id = 1; id < nextId; id++) if (this.alive[id] !== 1) this.free.push(id);
  }
}
