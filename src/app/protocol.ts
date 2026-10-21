// Types shared between the simulation worker and the main thread. Control
// calls go through Comlink; per-frame poses travel as a transferable
// Float64Array with the layout below (MASTER 5.2).

/** A body as the renderer needs it: shape, size and whether it moves. */
export type BodyDescriptor =
  | {
      readonly id: number;
      readonly name: string;
      readonly kind: 'fixed' | 'dynamic';
      readonly shape: 'cuboid';
      /** Half extents, m. Full extents are twice these. */
      readonly halfExtents: readonly [number, number, number];
    }
  | {
      readonly id: number;
      readonly name: string;
      readonly kind: 'fixed' | 'dynamic';
      readonly shape: 'ball';
      /** Radius, m. */
      readonly radius: number;
    };

/**
 * Frame buffer layout (Float64):
 *   [0] tick            [1] simTime (s)   [2] alpha (0..1)
 *   [3] belowRealTime   [4] asStepMs      [5] bodyCount
 * then per body FRAME_BODY_STRIDE values:
 *   id, prev px py pz qx qy qz qw, curr px py pz qx qy qz qw
 * prev is the pose at the previous tick, curr at the current tick; the
 * renderer interpolates between them by alpha.
 */
export const FRAME_HEADER = 6;
export const FRAME_BODY_STRIDE = 15;
export const FRAME_TICK = 0;
export const FRAME_SIM_TIME = 1;
export const FRAME_ALPHA = 2;
export const FRAME_BELOW_REAL_TIME = 3;
export const FRAME_AS_STEP_MS = 4;
export const FRAME_BODY_COUNT = 5;

export interface FrameResult {
  readonly buffer: Float64Array;
  /** Latest state hash (16 hex characters): every 60 ticks while running, exact while paused. */
  readonly hash: string;
  /** The tick that hash belongs to (D-003: the HUD says which tick it shows). */
  readonly hashTick: number;
  /** Progress of a visible replay started with startReplay(), or null. "done" is reported once. */
  readonly replay: ReplayProgress | null;
}

/** Answer to startReplay(): the original run's hash at the tick where the replay will stop. */
export interface ReplayStart {
  readonly originalHash: string;
  readonly targetTick: number;
}

export type ReplayProgress =
  | { readonly state: 'running'; readonly tick: number; readonly target: number }
  | { readonly state: 'done'; readonly check: ReplayCheck };

export interface BodyState {
  readonly id: number;
  readonly p: readonly [number, number, number];
  readonly q: readonly [number, number, number, number];
}

export interface SimState {
  readonly tick: number;
  readonly time: number;
  readonly hash: string;
  readonly bodies: readonly BodyState[];
}

export interface ReplayCheck {
  readonly originalHash: string;
  readonly replayHash: string;
  readonly matches: boolean;
  readonly ticks: number;
}
