// Scene definitions are plain data validated at the content boundary
// (src/content/schemas); the simulation trusts the typed object.

export type Vec3 = readonly [number, number, number];
export type Quat = readonly [number, number, number, number];

export interface BodyDef {
  readonly name: string;
  readonly kind: 'fixed' | 'dynamic';
  readonly shape: 'cuboid' | 'ball';
  /** Half extents for cuboids, m. */
  readonly halfExtents?: Vec3;
  /** Radius for balls, m. */
  readonly radius?: number;
  readonly position: Vec3;
  readonly rotation?: Quat;
  readonly linvel?: Vec3;
  readonly angvel?: Vec3;
  /** kg/m^3 */
  readonly density?: number;
  readonly friction?: number;
  readonly restitution?: number;
}

export interface SceneDef {
  readonly id: string;
  readonly version: number;
  readonly gravity: Vec3;
  /** Tick length, s. Fixed per scene and recorded in replays. Default 1/120. */
  readonly dt?: number;
  /** Mechanics substeps per tick. Default 2. */
  readonly mechanicsSubsteps?: number;
  readonly bodies: readonly BodyDef[];
}
