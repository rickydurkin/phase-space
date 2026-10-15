import { describe, it, expect } from 'vitest';
import { World, Pose, Velocity, RigidBody } from '../../src/sim/core/world.ts';
import { Fnv1a64 } from '../../src/sim/core/hash.ts';

function hashOf(w: World): string {
  const h = new Fnv1a64();
  w.hashInto(h);
  return h.hex();
}

describe('World entity registry', () => {
  it('allocates ids in order, reuses the smallest free id, iterates ascending', () => {
    const w = new World();
    expect([w.createEntity(), w.createEntity(), w.createEntity()]).toEqual([1, 2, 3]);
    w.destroyEntity(2);
    w.destroyEntity(1);
    expect(w.createEntity()).toBe(1);
    expect(w.createEntity()).toBe(2);
    expect(w.createEntity()).toBe(4);
    expect(w.entities()).toEqual([1, 2, 3, 4]);
  });

  it('filters entities by component and clears data on removal', () => {
    const w = new World();
    const a = w.createEntity();
    const b = w.createEntity();
    w.add(a, Pose);
    w.add(b, Pose);
    w.add(b, Velocity);
    w.store(Velocity).field('vx')[b] = 3;
    expect(w.entities(Pose, Velocity)).toEqual([b]);
    w.remove(b, Velocity);
    expect(w.store(Velocity).field('vx')[b]).toBe(0);
    expect(w.has(b, Velocity)).toBe(false);
  });

  it('serialises and restores to an identical hash, including free ids', () => {
    const w = new World();
    for (let i = 0; i < 5; i++) {
      const id = w.createEntity();
      w.add(id, Pose);
      w.add(id, RigidBody);
      w.store(Pose).field('py')[id] = i * 1.5;
      w.store(RigidBody).field('mass')[id] = 10 + i;
    }
    w.destroyEntity(3);
    const bytes = w.serialise();
    const h = hashOf(w);
    const v = new World();
    v.deserialise(bytes);
    expect(hashOf(v)).toBe(h);
    expect(v.entities()).toEqual([1, 2, 4, 5]);
    expect(v.createEntity()).toBe(3);
    expect(v.store(Pose).field('py')[5]).toBe(6);
  });

  it('hash changes when any component value changes', () => {
    const w = new World();
    const id = w.createEntity();
    w.add(id, Pose);
    const h0 = hashOf(w);
    w.store(Pose).field('px')[id] = 1e-12;
    expect(hashOf(w)).not.toBe(h0);
  });

  it('rejects over-capacity and double destroy', () => {
    const w = new World(undefined, 4);
    w.createEntity();
    w.createEntity();
    w.createEntity();
    expect(() => w.createEntity()).toThrow(/capacity/);
    w.destroyEntity(2);
    expect(() => w.destroyEntity(2)).toThrow(/not alive/);
  });
});
