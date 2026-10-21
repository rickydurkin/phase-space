// Presentation renderer (WP0.5): three.js WebGPURenderer with the WebGL2
// backend as fallback, a floor and the scene bodies with decent materials and
// light, interpolation between AS ticks, resize handling, pixel readback for
// tests and WebGPU device-loss recovery.

import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  DirectionalLight,
  HemisphereLight,
  CanvasTexture,
  RenderTarget,
  Color,
  Vector2,
  Vector3,
  Quaternion,
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
  RepeatWrapping,
  UnsignedByteType,
  RGBAFormat,
} from 'three/webgpu';
import type { Material, BufferGeometry } from 'three/webgpu';
import {
  FRAME_HEADER,
  FRAME_BODY_STRIDE,
  FRAME_ALPHA,
  FRAME_BODY_COUNT,
} from '../app/protocol.ts';
import type { BodyDescriptor } from '../app/protocol.ts';

export type BackendName = 'WebGPU' | 'WebGL2';

export interface RendererOptions {
  /** Use the WebGL2 backend even when WebGPU is available. */
  readonly forceWebGL: boolean;
}

/** The subset of the WebGPU backend we touch, not exposed by three's typings. */
interface BackendInternals {
  readonly isWebGPUBackend?: boolean;
  readonly device?: GPUDevice | null;
}

const BACKGROUND = 0x1b1d22;
const FLOOR_GREY = 0x6f7378;
const WOOD = 0xb5793f;
const BALL = 0x7a8fa6;
const MAX_PIXEL_RATIO = 2;

function makeGridTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('2D canvas context unavailable for the floor grid');
  ctx.fillStyle = '#8a8e93';
  ctx.fillRect(0, 0, size, size);
  // One texture tile covers 2 m x 2 m: fine lines every 0.5 m, a stronger line every 1 m.
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const p = (i * size) / 4 + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    const p = (i * size) / 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Recovery attempts after a device loss: WebGPU three times, then WebGL2 (D-010). */
interface RecoveryAttempt {
  readonly forceWebGL: boolean;
  readonly delayMs: number;
}
const WEBGPU_THEN_WEBGL_ATTEMPTS: readonly RecoveryAttempt[] = [
  { forceWebGL: false, delayMs: 0 },
  { forceWebGL: false, delayMs: 500 },
  { forceWebGL: false, delayMs: 2000 },
  { forceWebGL: true, delayMs: 0 },
];
const WEBGL_ATTEMPTS: readonly RecoveryAttempt[] = [
  { forceWebGL: true, delayMs: 0 },
  { forceWebGL: true, delayMs: 1000 },
];
/** More than this many losses within the window means WebGPU cannot hold a device here. */
const MAX_RECOVERIES_IN_WINDOW = 2;
const RECOVERY_WINDOW_MS = 10_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SceneRenderer {
  readonly camera: PerspectiveCamera;
  /** Called after a lost GPU device has been replaced. */
  onDeviceLost: (message: string) => void = () => undefined;
  /** Called with the new canvas when recovery replaces it, so input handlers can move to it (D-002). */
  onCanvasReplaced: (canvas: HTMLCanvasElement) => void = () => undefined;
  /** Called when the device cannot be replaced: rendering has stopped, the simulation keeps running. */
  onRecoveryFailed: (error: unknown) => void = () => undefined;

  private renderer: WebGPURenderer;
  private scene: Scene;
  private backendName: BackendName;
  private readonly container: HTMLElement;
  private readonly options: RendererOptions;
  private bodies: readonly BodyDescriptor[] = [];
  private meshes = new Map<number, Mesh>();
  private disposables: Array<{ dispose(): void }> = [];
  private lost = false;
  /** Error-scope checks that were pending when the GPU instance went away (D-001). */
  private droppedErrorChecks = 0;
  private disposed = false;
  private readonly pa = new Vector3();
  private readonly pb = new Vector3();
  private readonly qa = new Quaternion();
  private readonly qb = new Quaternion();
  private readonly size = new Vector2();
  private readonly onResize = (): void => {
    this.resize();
  };

  private constructor(container: HTMLElement, options: RendererOptions, renderer: WebGPURenderer) {
    this.container = container;
    this.options = options;
    this.renderer = renderer;
    this.backendName = SceneRenderer.detectBackend(renderer);
    this.camera = new PerspectiveCamera(45, 1, 0.1, 200);
    this.scene = this.buildScene();
    this.configure(renderer);
    this.watchDevice(renderer);
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  static async create(container: HTMLElement, options: RendererOptions): Promise<SceneRenderer> {
    const renderer = await SceneRenderer.makeRenderer(options);
    container.append(renderer.domElement);
    return new SceneRenderer(container, options, renderer);
  }

  private static async makeRenderer(options: RendererOptions): Promise<WebGPURenderer> {
    // Without navigator.gpu three would warn on the console before falling back;
    // choose the WebGL2 backend up front instead.
    const forceWebGL = options.forceWebGL || typeof navigator.gpu === 'undefined';
    const renderer = new WebGPURenderer({ antialias: true, forceWebGL });
    await renderer.init();
    return renderer;
  }

  private static detectBackend(renderer: WebGPURenderer): BackendName {
    const backend = renderer.backend as unknown as BackendInternals;
    return backend.isWebGPUBackend === true ? 'WebGPU' : 'WebGL2';
  }

  get backend(): BackendName {
    return this.backendName;
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Replace the drawn bodies (called after load). */
  setBodies(bodies: readonly BodyDescriptor[]): void {
    this.bodies = bodies;
    this.rebuildMeshes();
  }

  /** Interpolate poses from a frame buffer (protocol.ts layout). */
  applyFrame(frame: Float64Array): void {
    const alpha = frame[FRAME_ALPHA] ?? 0;
    const n = frame[FRAME_BODY_COUNT] ?? 0;
    for (let i = 0; i < n; i++) {
      const o = FRAME_HEADER + i * FRAME_BODY_STRIDE;
      const mesh = this.meshes.get(frame[o] ?? -1);
      if (mesh === undefined) continue;
      this.pa.set(frame[o + 1] ?? 0, frame[o + 2] ?? 0, frame[o + 3] ?? 0);
      this.qa.set(frame[o + 4] ?? 0, frame[o + 5] ?? 0, frame[o + 6] ?? 0, frame[o + 7] ?? 1);
      this.pb.set(frame[o + 8] ?? 0, frame[o + 9] ?? 0, frame[o + 10] ?? 0);
      this.qb.set(frame[o + 11] ?? 0, frame[o + 12] ?? 0, frame[o + 13] ?? 0, frame[o + 14] ?? 1);
      mesh.position.lerpVectors(this.pa, this.pb, alpha);
      mesh.quaternion.slerpQuaternions(this.qa, this.qb, alpha);
    }
  }

  render(): void {
    if (this.lost || this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Render the scene into an off-screen target and read back an RGBA region
   * (drawing-buffer pixels, origin top-left). Used by tests to prove the cube is visible.
   */
  async readPixels(x: number, y: number, w: number, h: number): Promise<Uint8Array> {
    if (this.lost) throw new Error('GPU device is lost; readPixels is unavailable until recovery completes');
    const full = this.renderer.getDrawingBufferSize(this.size);
    const width = Math.max(1, Math.floor(full.x));
    const height = Math.max(1, Math.floor(full.y));
    const rx = Math.floor(x);
    const ry = Math.floor(y);
    const rw = Math.floor(w);
    const rh = Math.floor(h);
    if (rw < 1 || rh < 1 || rx < 0 || ry < 0 || rx + rw > width || ry + rh > height) {
      throw new RangeError(
        `readPixels region ${rx},${ry} ${rw}x${rh} is outside the ${width}x${height} drawing buffer`,
      );
    }
    const target = new RenderTarget(width, height, { type: UnsignedByteType, format: RGBAFormat, depthBuffer: true });
    const webgl = this.backendName === 'WebGL2';
    try {
      // Marking the target as the output target keeps tone mapping and the sRGB
      // output transform, so the bytes match what the canvas shows.
      this.renderer.setOutputRenderTarget(target);
      this.renderer.setRenderTarget(target);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.renderer.setOutputRenderTarget(null);
      // WebGL reads with a bottom-left origin; convert so callers always use top-left.
      const readY = webgl ? height - (ry + rh) : ry;
      const data = await this.renderer.readRenderTargetPixelsAsync(target, rx, readY, rw, rh);
      const raw = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      return packRows(raw, rw, rh, webgl);
    } finally {
      this.renderer.setRenderTarget(null);
      this.renderer.setOutputRenderTarget(null);
      target.dispose();
    }
  }

  /** Live GPU resources, from three.js (soak test, D-006). */
  resourceCounts(): { geometries: number; textures: number } {
    const m = this.renderer.info.memory;
    return { geometries: m.geometries, textures: m.textures };
  }

  /** Destroy the WebGPU device to exercise device-loss recovery. Returns false on WebGL2. */
  crashDevice(): boolean {
    const device = this.device();
    if (device === null) return false;
    this.lost = true;
    device.destroy();
    return true;
  }

  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.clearSceneResources();
    void this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private device(): GPUDevice | null {
    const backend = this.renderer.backend as unknown as BackendInternals;
    if (backend.isWebGPUBackend !== true) return null;
    return backend.device ?? null;
  }

  private configure(renderer: WebGPURenderer): void {
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.setClearColor(new Color(BACKGROUND), 1);
    // three only reports losses it did not cause itself; we also watch device.lost below.
    renderer.onDeviceLost = (info) => {
      void this.recover(`${info.message}${info.reason === null ? '' : ` (${info.reason})`}`);
    };
  }

  private watchDevice(renderer: WebGPURenderer): void {
    const backend = renderer.backend as unknown as BackendInternals;
    const device = backend.isWebGPUBackend === true ? backend.device : null;
    if (device === null || device === undefined) return;
    this.guardErrorScopes(device);
    void device.lost.then((info) => {
      if (this.renderer !== renderer) return; // already replaced
      void this.recover(`${info.message || 'unknown reason'}${info.reason ? ` (${info.reason})` : ''}`);
    });
  }

  /**
   * D-001: when the GPU process dies, every pending popErrorScope promise rejects
   * with 'OperationError: Instance dropped in popErrorScope'. three.js 0.186 calls
   * device.popErrorScope().then(...) without a rejection handler when it creates
   * pipelines, so a pipeline in flight at the moment of the crash became an
   * unhandled rejection in the error overlay. That rejection is a consequence of
   * the device loss handled by recover(), so on this device it resolves to null
   * and is counted; the count goes into the recovery note. Every other rejection
   * passes through unchanged.
   */
  private guardErrorScopes(device: GPUDevice): void {
    const pop = device.popErrorScope.bind(device);
    device.popErrorScope = (): Promise<GPUError | null> =>
      pop().catch((e: unknown) => {
        const name = typeof e === 'object' && e !== null ? (e as { name?: unknown }).name : undefined;
        const message = typeof e === 'object' && e !== null ? String((e as { message?: unknown }).message) : '';
        if (name === 'OperationError' && /Instance dropped/i.test(message)) {
          this.droppedErrorChecks++;
          return null;
        }
        throw e;
      });
  }

  private recovering: Promise<void> | null = null;
  /** performance.now() of recent recoveries, for detecting a device that keeps failing. */
  private recoveryTimes: number[] = [];
  /** Test builds only (failNextRecoveries): make the next n renderer creations fail. */
  private forcedFailures = 0;

  /** Test hook: the next n attempts to create a renderer during recovery fail (D-010 tests). */
  failNextRecoveries(n: number): void {
    this.forcedFailures = Math.max(0, Math.floor(n));
  }

  /**
   * Replace a lost device (D-010). The old canvas stays in the page until a new
   * renderer exists, so a failed attempt never leaves the page without a canvas.
   * WebGPU is retried three times (0, 0.5 and 2 s), then WebGL2 is tried; more
   * than two losses within 10 s go straight to WebGL2. If every attempt fails,
   * rendering stops visibly through onRecoveryFailed while the simulation keeps
   * running in its worker. This promise never rejects.
   */
  private recover(reason: string): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.recovering !== null) return this.recovering;
    this.lost = true;
    this.recovering = this.runRecovery(reason).catch((e: unknown) => {
      this.recovering = null;
      this.onRecoveryFailed(e);
    });
    return this.recovering;
  }

  private async runRecovery(reason: string): Promise<void> {
    const old = this.renderer;
    const now = performance.now();
    this.recoveryTimes = this.recoveryTimes.filter((t) => now - t < RECOVERY_WINDOW_MS);
    this.recoveryTimes.push(now);
    const webglOnly = this.options.forceWebGL || this.recoveryTimes.length > MAX_RECOVERIES_IN_WINDOW;
    const attempts = webglOnly ? WEBGL_ATTEMPTS : WEBGPU_THEN_WEBGL_ATTEMPTS;
    const failures: string[] = [];
    let fresh: WebGPURenderer | null = null;
    for (const attempt of attempts) {
      if (attempt.delayMs > 0) await sleep(attempt.delayMs);
      if (this.disposed) return;
      try {
        if (this.forcedFailures > 0) {
          this.forcedFailures--;
          throw new Error('forced failure (test hook)');
        }
        fresh = await SceneRenderer.makeRenderer({ ...this.options, forceWebGL: attempt.forceWebGL });
        break;
      } catch (e) {
        failures.push(`${attempt.forceWebGL ? 'WebGL2' : 'WebGPU'}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (fresh === null) {
      // Rendering stays stopped (lost remains true); the last canvas stays in place.
      this.recovering = null;
      this.onRecoveryFailed(
        new Error(`GPU device lost (${reason}) and recovery failed after ${failures.length} attempts: ${failures.join('; ')}`),
      );
      return;
    }

    let disposeNote = '';
    try {
      await old.dispose();
    } catch (e) {
      disposeNote = `; old renderer dispose failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    if (old.domElement.isConnected) old.domElement.replaceWith(fresh.domElement);
    else this.container.append(fresh.domElement);
    this.clearSceneResources();

    this.renderer = fresh;
    this.backendName = SceneRenderer.detectBackend(fresh);
    this.configure(fresh);
    this.scene = this.buildScene();
    this.rebuildMeshes();
    this.resize();
    this.watchDevice(fresh);
    this.lost = false;
    this.recovering = null;
    this.onCanvasReplaced(fresh.domElement);
    const dropped =
      this.droppedErrorChecks > 0 ? `; ${this.droppedErrorChecks} pending GPU error checks dropped with the old device` : '';
    this.droppedErrorChecks = 0;
    const retried = failures.length > 0 ? `; ${failures.length} failed attempts first (${failures.join('; ')})` : '';
    this.onDeviceLost(`GPU device lost: recovered on ${this.backendName} (${reason}${disposeNote}${dropped}${retried})`);
  }

  private buildScene(): Scene {
    const scene = new Scene();
    scene.background = new Color(BACKGROUND);

    const hemi = new HemisphereLight(0xaebfd2, 0x3a342c, 0.9);
    scene.add(hemi);

    const sun = new DirectionalLight(0xfff1dc, 2.6);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = -7;
    cam.right = 7;
    cam.top = 7;
    cam.bottom = -7;
    cam.near = 1;
    cam.far = 30;
    cam.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    scene.add(sun.target);
    return scene;
  }

  private rebuildMeshes(): void {
    for (const mesh of this.meshes.values()) this.scene.remove(mesh);
    this.clearSceneResources();
    this.meshes = new Map();

    const grid = makeGridTexture();
    this.disposables.push(grid);
    for (const b of this.bodies) {
      let geometry: BufferGeometry;
      let material: Material;
      if (b.shape === 'cuboid') {
        const [hx, hy, hz] = b.halfExtents;
        geometry = new BoxGeometry(hx * 2, hy * 2, hz * 2);
        if (b.kind === 'fixed') {
          const tex = grid.clone();
          tex.repeat.set(hx, hz);
          tex.needsUpdate = true;
          this.disposables.push(tex);
          material = new MeshStandardMaterial({ color: FLOOR_GREY, map: tex, roughness: 0.85, metalness: 0.0 });
        } else {
          material = new MeshStandardMaterial({ color: WOOD, roughness: 0.55, metalness: 0.0 });
        }
      } else {
        geometry = new SphereGeometry(b.radius, 48, 32);
        material = new MeshStandardMaterial({ color: BALL, roughness: 0.4, metalness: 0.1 });
      }
      const mesh = new Mesh(geometry, material);
      mesh.name = b.name;
      mesh.castShadow = b.kind === 'dynamic';
      mesh.receiveShadow = true;
      this.disposables.push(geometry, material);
      this.scene.add(mesh);
      this.meshes.set(b.id, mesh);
    }
  }

  private clearSceneResources(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}

/**
 * Normalise a readback to tightly packed RGBA rows, top row first. The WebGPU
 * backend returns rows padded to 256 bytes; the WebGL backend returns tight
 * rows with the bottom row first.
 */
function packRows(raw: Uint8Array, w: number, h: number, bottomUp: boolean): Uint8Array {
  const rowBytes = w * 4;
  const out = new Uint8Array(rowBytes * h);
  const stride = h > 1 ? Math.floor((raw.length - rowBytes) / (h - 1)) : rowBytes;
  for (let row = 0; row < h; row++) {
    const src = (bottomUp ? h - 1 - row : row) * stride;
    out.set(raw.subarray(src, src + rowBytes), row * rowBytes);
  }
  return out;
}
