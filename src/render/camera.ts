// Orbit camera for Mac trackpads and mice (MASTER 10.4).
//
//   left-drag                 orbit
//   wheel without ctrlKey     orbit (two-finger drag on a trackpad)
//   wheel with ctrlKey        dolly (a pinch arrives as a wheel event with ctrlKey set)
//   shift-drag or right-drag  pan
//
// Every input moves a goal; the camera eases towards the goal each frame.

import { Vector3 } from 'three/webgpu';
import type { PerspectiveCamera } from 'three/webgpu';

export interface OrbitOptions {
  readonly target?: readonly [number, number, number];
  readonly distance?: number;
  /** Rotation about the vertical axis, rad. */
  readonly yaw?: number;
  /** Elevation above the horizontal plane, rad. */
  readonly pitch?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  /** Larger is snappier. */
  readonly damping?: number;
}

const ORBIT_PER_PIXEL = 0.005;
const PAN_PER_PIXEL = 0.0016;
const DOLLY_PER_PIXEL = 0.01;
const MIN_PITCH = -0.15;
const MAX_PITCH = 1.5;

export class OrbitCameraController {
  readonly camera: PerspectiveCamera;
  private element: HTMLElement;
  private readonly goalTarget: Vector3;
  private readonly target: Vector3;
  private goalYaw: number;
  private goalPitch: number;
  private goalDistance: number;
  private yaw: number;
  private pitch: number;
  private distance: number;
  private readonly minDistance: number;
  private readonly maxDistance: number;
  private readonly damping: number;
  private drag: { pointerId: number; mode: 'orbit' | 'pan'; x: number; y: number } | null = null;
  private readonly scratchRight = new Vector3();
  private readonly scratchUp = new Vector3();
  private readonly scratchForward = new Vector3();

  constructor(camera: PerspectiveCamera, element: HTMLElement, options: OrbitOptions = {}) {
    this.camera = camera;
    this.element = element;
    const t = options.target ?? [0, 0.6, 0];
    this.goalTarget = new Vector3(t[0], t[1], t[2]);
    this.target = this.goalTarget.clone();
    this.goalYaw = this.yaw = options.yaw ?? 0.65;
    this.goalPitch = this.pitch = options.pitch ?? 0.38;
    this.goalDistance = this.distance = options.distance ?? 6;
    this.minDistance = options.minDistance ?? 1.5;
    this.maxDistance = options.maxDistance ?? 60;
    this.damping = options.damping ?? 14;

    this.listen(element);
    this.apply();
  }

  /** The element whose pointer and wheel events drive the camera. */
  get inputElement(): HTMLElement {
    return this.element;
  }

  /**
   * Move input handling to a new element, for example the canvas that replaces
   * a lost one after device-loss recovery (D-002). Camera position is kept.
   */
  attach(element: HTMLElement): void {
    if (element === this.element) return;
    this.unlisten(this.element);
    this.drag = null;
    this.element = element;
    this.listen(element);
  }

  dispose(): void {
    this.unlisten(this.element);
  }

  private listen(e: HTMLElement): void {
    e.addEventListener('pointerdown', this.onPointerDown);
    e.addEventListener('pointermove', this.onPointerMove);
    e.addEventListener('pointerup', this.onPointerEnd);
    e.addEventListener('pointercancel', this.onPointerEnd);
    e.addEventListener('wheel', this.onWheel, { passive: false });
    e.addEventListener('contextmenu', this.onContextMenu);
  }

  private unlisten(e: HTMLElement): void {
    e.removeEventListener('pointerdown', this.onPointerDown);
    e.removeEventListener('pointermove', this.onPointerMove);
    e.removeEventListener('pointerup', this.onPointerEnd);
    e.removeEventListener('pointercancel', this.onPointerEnd);
    e.removeEventListener('wheel', this.onWheel);
    e.removeEventListener('contextmenu', this.onContextMenu);
  }

  /** Ease towards the goals and position the camera. dt in seconds. */
  update(dt: number): void {
    const k = 1 - Math.exp(-Math.max(0, dt) * this.damping);
    this.yaw += (this.goalYaw - this.yaw) * k;
    this.pitch += (this.goalPitch - this.pitch) * k;
    this.distance += (this.goalDistance - this.distance) * k;
    this.target.lerp(this.goalTarget, k);
    this.apply();
  }

  private apply(): void {
    const cp = Math.cos(this.pitch);
    this.camera.position.set(
      this.target.x + this.distance * cp * Math.sin(this.yaw),
      this.target.y + this.distance * Math.sin(this.pitch),
      this.target.z + this.distance * cp * Math.cos(this.yaw),
    );
    this.camera.lookAt(this.target);
  }

  private orbit(dx: number, dy: number): void {
    this.goalYaw -= dx * ORBIT_PER_PIXEL;
    this.goalPitch = clamp(this.goalPitch + dy * ORBIT_PER_PIXEL, MIN_PITCH, MAX_PITCH);
  }

  private pan(dx: number, dy: number): void {
    const scale = this.goalDistance * PAN_PER_PIXEL;
    this.scratchForward.subVectors(this.target, this.camera.position).normalize();
    this.scratchRight.crossVectors(this.scratchForward, this.camera.up).normalize();
    this.scratchUp.crossVectors(this.scratchRight, this.scratchForward).normalize();
    this.goalTarget.addScaledVector(this.scratchRight, -dx * scale);
    this.goalTarget.addScaledVector(this.scratchUp, dy * scale);
  }

  private dolly(delta: number): void {
    this.goalDistance = clamp(this.goalDistance * Math.exp(delta * DOLLY_PER_PIXEL), this.minDistance, this.maxDistance);
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.button !== 2) return;
    const mode = e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
    this.drag = { pointerId: e.pointerId, mode, x: e.clientX, y: e.clientY };
    this.element.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (d === null || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    if (d.mode === 'orbit') this.orbit(dx, dy);
    else this.pan(dx, dy);
  };

  private readonly onPointerEnd = (e: PointerEvent): void => {
    if (this.drag === null || this.drag.pointerId !== e.pointerId) return;
    this.drag = null;
    if (this.element.hasPointerCapture(e.pointerId)) this.element.releasePointerCapture(e.pointerId);
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    // deltaMode 1 is lines (Firefox with a mouse wheel); scale to pixels.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const dx = e.deltaX * unit;
    const dy = e.deltaY * unit;
    if (e.ctrlKey) this.dolly(dy);
    else this.orbit(dx, dy);
  };

  private readonly onContextMenu = (e: Event): void => {
    e.preventDefault();
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
