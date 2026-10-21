import { describe, it, expect } from 'vitest';
import { Simulation, cubeDrop, runReplay, makeReplay } from '../../src/sim/index.ts';
import type { InputCommand } from '../../src/sim/index.ts';

// D-005: inputs are validated when queued, so a bad one is rejected to its sender
// and can neither stop the simulation later nor poison a replay.
describe('input validation (D-005)', () => {
  it('rejects an input for an entity that does not exist, and the simulation keeps running', async () => {
    const sim = await Simulation.create(cubeDrop, { seed: 1 });
    expect(() => sim.queueInput({ type: 'impulse', tick: 240, entity: 99, ix: 0, iy: 100, iz: 0 })).toThrow(/unknown entity 99/);
    expect(sim.inputs).toHaveLength(0);
    sim.advance(300);
    expect(sim.tick).toBe(300);
  });

  it('rejects non-finite values, fractional or negative ticks and unknown types', async () => {
    const sim = await Simulation.create(cubeDrop, { seed: 1 });
    expect(() => sim.queueInput({ type: 'impulse', tick: 10, entity: 2, ix: Number.NaN, iy: 0, iz: 0 })).toThrow(/finite/);
    expect(() => sim.queueInput({ type: 'nudge', tick: 10, entity: 2, dx: 0, dy: Infinity, dz: 0 })).toThrow(/finite/);
    expect(() => sim.queueInput({ type: 'wake', tick: 10.5, entity: 2 })).toThrow(/whole number/);
    expect(() => sim.queueInput({ type: 'wake', tick: -1, entity: 2 })).toThrow(/whole number/);
    expect(() => sim.queueInput({ type: 'explode', tick: 10, entity: 2 } as unknown as InputCommand)).toThrow(/unknown input type/);
    expect(sim.inputs).toHaveLength(0);
  });

  it('stores a copy, so changing the caller\'s object later cannot change the log', async () => {
    const sim = await Simulation.create(cubeDrop, { seed: 1 });
    const cmd = { type: 'impulse' as const, tick: 5, entity: 2, ix: 1, iy: 2, iz: 3 };
    sim.queueInput(cmd);
    cmd.iy = 999;
    expect(sim.inputs[0]).toEqual({ type: 'impulse', tick: 5, entity: 2, ix: 1, iy: 2, iz: 3 });
  });

  it('a replay file carrying an input for an unknown entity fails at load with a clear error, before any tick runs', async () => {
    const sim = await Simulation.create(cubeDrop, { seed: 1 });
    sim.advance(10);
    const good = makeReplay(sim, 'test', 10, 10, [{ tick: 10, hash: sim.hash() }]);
    const bad = { ...good, inputs: [{ type: 'impulse', tick: 5, entity: 42, ix: 0, iy: 1, iz: 0 }] as InputCommand[] };
    await expect(runReplay(bad)).rejects.toThrow(/unknown entity 42/);
  });

  it('valid inputs still work and replay identically', async () => {
    const inputs: InputCommand[] = [{ type: 'impulse', tick: 100, entity: 2, ix: 50, iy: 400, iz: 0 }];
    const a = await Simulation.create(cubeDrop, { seed: 1 });
    for (const c of inputs) a.queueInput(c);
    a.advance(400);
    const b = await Simulation.create(cubeDrop, { seed: 1 });
    for (const c of inputs) b.queueInput(c);
    b.advance(400);
    expect(a.hash()).toBe(b.hash());
  });
});
