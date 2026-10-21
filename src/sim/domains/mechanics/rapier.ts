// Mechanics domain: rigid bodies through the Rapier cross-platform
// deterministic build. The AS keeps the entity to body mapping and mirrors
// pose, velocity, mass and sleep state into components after every tick, so
// hashing, observation and other domains read components, never Rapier.

import RAPIER from '@dimforge/rapier3d-deterministic-compat';
import type { World, EntityId } from '../../core/world.ts';
import { Pose, Velocity, RigidBody } from '../../core/world.ts';
import type {
  DomainModule,
  DomainConfig,
  StepContext,
  BenchResult,
  ModelCard,
  InputCommand,
} from '../../core/types.ts';
import type { ObservationSink } from '../../core/observe.ts';
import { ByteWriter, ByteReader } from '../../core/bytes.ts';

let rapierReady: Promise<void> | null = null;

/** Initialise the Rapier WebAssembly module once per thread. */
export function initRapier(): Promise<void> {
  if (rapierReady === null) rapierReady = RAPIER.init();
  return rapierReady;
}

export const MECHANICS_MODEL_CARD: ModelCard = {
  id: 'mechanics-rigid',
  name: 'Rigid bodies (Rapier)',
  domain: 'mechanics',
  badge: 'Real',
  summary:
    'Solid objects that do not bend. Gravity, contact, friction and bounce are solved by the Rapier engine in fixed steps of 1/240 s, so the same start always gives the same motion.',
  benches: ['M1'],
};

export class RapierMechanics implements DomainModule {
  readonly name = 'mechanics';
  private rapier: RAPIER.World | null = null;
  private readonly bodies = new Map<EntityId, RAPIER.RigidBody>();
  private substeps = 2;
  private gravity: readonly [number, number, number] = [0, -9.80665, 0];
  private kinetic = 0;
  private gravitational = 0;
  private sleepingCount = 0;

  private get world(): RAPIER.World {
    if (this.rapier === null) throw new Error('mechanics not initialised');
    return this.rapier;
  }

  init(world: World, config: DomainConfig): void {
    this.substeps = config.mechanicsSubsteps;
    this.gravity = config.gravity;
    const w = new RAPIER.World({ x: config.gravity[0], y: config.gravity[1], z: config.gravity[2] });
    w.integrationParameters.dt = config.dt / config.mechanicsSubsteps;
    this.rapier = w;
    this.bodies.clear();
    const pose = world.store(Pose);
    const vel = world.store(Velocity);
    const rb = world.store(RigidBody);
    for (const id of world.entities(Pose, RigidBody)) {
      const kind = rb.field('kind')[id];
      const desc = (kind === 1 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed())
        .setTranslation(pose.field('px')[id] as number, pose.field('py')[id] as number, pose.field('pz')[id] as number)
        .setRotation({
          x: pose.field('qx')[id] as number,
          y: pose.field('qy')[id] as number,
          z: pose.field('qz')[id] as number,
          w: pose.field('qw')[id] as number,
        });
      if (world.has(id, Velocity)) {
        desc.setLinvel(vel.field('vx')[id] as number, vel.field('vy')[id] as number, vel.field('vz')[id] as number);
        desc.setAngvel({ x: vel.field('wx')[id] as number, y: vel.field('wy')[id] as number, z: vel.field('wz')[id] as number });
      }
      const body = w.createRigidBody(desc);
      const shape = rb.field('shape')[id];
      const col =
        shape === 1
          ? RAPIER.ColliderDesc.ball(rb.field('hx')[id] as number)
          : RAPIER.ColliderDesc.cuboid(rb.field('hx')[id] as number, rb.field('hy')[id] as number, rb.field('hz')[id] as number);
      col.setDensity(rb.field('density')[id] as number);
      col.setFriction(rb.field('friction')[id] as number);
      col.setRestitution(rb.field('restitution')[id] as number);
      w.createCollider(col, body);
      this.bodies.set(id, body);
      rb.field('mass')[id] = body.mass();
    }
    this.mirror(world);
  }

  /** Apply a player or test input to a body. */
  applyInput(cmd: InputCommand): void {
    const body = this.bodies.get(cmd.entity);
    if (body === undefined) throw new Error(`input targets unknown entity ${cmd.entity}`);
    switch (cmd.type) {
      case 'impulse':
        body.applyImpulse({ x: cmd.ix, y: cmd.iy, z: cmd.iz }, true);
        break;
      case 'nudge': {
        const t = body.translation();
        body.setTranslation({ x: t.x + cmd.dx, y: t.y + cmd.dy, z: t.z + cmd.dz }, true);
        break;
      }
      case 'wake':
        body.wakeUp();
        break;
      default:
        break;
    }
  }

  step(world: World, _dt: number, _ctx: StepContext): void {
    const w = this.world;
    for (let i = 0; i < this.substeps; i++) w.step();
    this.mirror(world);
    _ctx.ledger.report('kinetic', this.kinetic);
    _ctx.ledger.report('gravitational', this.gravitational);
  }

  /** Copy body state into components (id order) and total the energies. */
  private mirror(world: World): void {
    const pose = world.store(Pose);
    const vel = world.store(Velocity);
    const rb = world.store(RigidBody);
    const [gx, gy, gz] = this.gravity;
    let ke = 0;
    let pe = 0;
    let sleeping = 0;
    for (const [id, body] of this.bodies) {
      const t = body.translation();
      const r = body.rotation();
      pose.field('px')[id] = t.x;
      pose.field('py')[id] = t.y;
      pose.field('pz')[id] = t.z;
      pose.field('qx')[id] = r.x;
      pose.field('qy')[id] = r.y;
      pose.field('qz')[id] = r.z;
      pose.field('qw')[id] = r.w;
      const asleep = body.isSleeping() ? 1 : 0;
      rb.field('sleeping')[id] = asleep;
      sleeping += asleep;
      if (!world.has(id, Velocity)) continue;
      const v = body.linvel();
      const av = body.angvel();
      vel.field('vx')[id] = v.x;
      vel.field('vy')[id] = v.y;
      vel.field('vz')[id] = v.z;
      vel.field('wx')[id] = av.x;
      vel.field('wy')[id] = av.y;
      vel.field('wz')[id] = av.z;
      if (!body.isDynamic()) continue;
      const m = body.mass();
      ke += 0.5 * m * (v.x * v.x + v.y * v.y + v.z * v.z);
      // Rotational energy: angular velocity into the body frame, then 0.5 * sum I_i w_i^2.
      const I = body.principalInertia();
      const lw = rotateByConjugate(r.x, r.y, r.z, r.w, av.x, av.y, av.z);
      ke += 0.5 * (I.x * lw[0] * lw[0] + I.y * lw[1] * lw[1] + I.z * lw[2] * lw[2]);
      // Gravitational potential relative to the origin plane: -m (g . x).
      const c = body.worldCom();
      pe += -m * (gx * c.x + gy * c.y + gz * c.z);
    }
    this.kinetic = ke;
    this.gravitational = pe;
    this.sleepingCount = sleeping;
  }

  observe(world: World, sink: ObservationSink): void {
    sink.publish('mechanics.energy.kinetic', this.kinetic, 'J');
    sink.publish('mechanics.energy.gravitational', this.gravitational, 'J');
    sink.publish('mechanics.bodies', this.bodies.size, '');
    sink.publish('mechanics.sleeping', this.sleepingCount, '');
    const pose = world.store(Pose);
    for (const [id] of this.bodies) {
      sink.publish(`body.${id}.height`, pose.field('py')[id] as number, 'm');
    }
  }

  serialise(): Uint8Array {
    const w = new ByteWriter(8192);
    w.bytes(this.world.takeSnapshot());
    w.u32(this.bodies.size);
    for (const [id, body] of this.bodies) w.u32(id).f64(body.handle);
    w.f64(this.kinetic).f64(this.gravitational).f64(this.sleepingCount);
    return w.finish();
  }

  deserialise(bytes: Uint8Array): void {
    const r = new ByteReader(bytes);
    const snap = r.bytes();
    const w = RAPIER.World.restoreSnapshot(snap);
    if (this.rapier !== null) this.rapier.free();
    this.rapier = w;
    this.bodies.clear();
    const n = r.u32();
    for (let i = 0; i < n; i++) {
      const id = r.u32();
      const handle = r.f64();
      const body = w.getRigidBody(handle);
      if (body === null || body === undefined) throw new Error(`restored world lacks body for entity ${id}`);
      this.bodies.set(id, body);
    }
    this.kinetic = r.f64();
    this.gravitational = r.f64();
    this.sleepingCount = r.f64();
  }

  validate(): BenchResult[] {
    return [];
  }

  modelCards(): ModelCard[] {
    return [MECHANICS_MODEL_CARD];
  }

  /** Free the Rapier world (WebAssembly memory) now rather than when the garbage collector runs. */
  dispose(): void {
    if (this.rapier !== null) this.rapier.free();
    this.rapier = null;
    this.bodies.clear();
  }

  /** Rapier integration parameters, for the model card and reports. */
  parameters(): Record<string, number> {
    const p = this.world.integrationParameters;
    return {
      dt: p.dt,
      numSolverIterations: p.numSolverIterations,
      numInternalPgsIterations: p.numInternalPgsIterations,
      maxCcdSubsteps: p.maxCcdSubsteps,
      normalizedAllowedLinearError: p.normalizedAllowedLinearError,
      normalizedPredictionDistance: p.normalizedPredictionDistance,
    };
  }
}

/** Rotate vector v by the conjugate of unit quaternion q (world to body frame). */
function rotateByConjugate(
  qx: number,
  qy: number,
  qz: number,
  qw: number,
  vx: number,
  vy: number,
  vz: number,
): [number, number, number] {
  // q* = (-qx, -qy, -qz, qw); v' = q* v q
  const x = -qx;
  const y = -qy;
  const z = -qz;
  const w = qw;
  // t = 2 * cross(q.xyz, v)
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  // v' = v + w * t + cross(q.xyz, t)
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ];
}
