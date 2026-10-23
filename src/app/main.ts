// Bootstrap for index.html (WP0.5). Order: error overlay, simulation worker,
// scene load and renderer, then the frame loop. The AS never runs on this
// thread; this file only forwards inputs and draws the frames it is given.

import * as Comlink from 'comlink';
import { installErrorOverlay } from '../ui/error-overlay.ts';
import { Hud } from '../ui/hud.ts';
import { SceneRenderer } from '../render/renderer.ts';
import { OrbitCameraController } from '../render/camera.ts';
import { installTestApi } from './test-api.ts';
import type { TestApiBackend } from './test-api.ts';
import type { SimWorker } from './sim-worker.ts';
import { FRAME_TICK, FRAME_SIM_TIME, FRAME_BELOW_REAL_TIME, FRAME_AS_STEP_MS } from './protocol.ts';
import type { ReplayCheck, FrameResult, ReplayProgress } from './protocol.ts';
import { RealTimeMonitor } from './realtime.ts';
import { parseReplayFile } from './replay-validate.ts';

const SCENE_ID = 'cube-drop';
const SEED = 1;
/** Longest wall-clock delta fed to the clock, s (tab switches, debugger pauses). */
// D-012: this cap only guards against long gaps (debugger, a stalled tab). It was 0.1 s, which
// threw simulated time away whenever rendering ran below 10 fps even when the AS could keep up
// (found by the first CI run: 0.21x of real time under SwiftShader). The real per-frame limit is
// the frame clock's 48-tick budget (MASTER 5.3), which flags what it drops; anything lost beyond
// it is caught by the real-time monitor.
const MAX_FRAME_SECONDS = 0.5;
const HUD_INTERVAL_MS = 50;

const overlay = installErrorOverlay();

let bootResolve: () => void = () => undefined;
let bootReject: (reason: unknown) => void = () => undefined;
const ready = new Promise<void>((resolve, reject) => {
  bootResolve = resolve;
  bootReject = reject;
});
// Boot failures are reported through the overlay below; this copy is handled.
ready.catch(() => undefined);

const attachTestBackend =
  import.meta.env.VITE_TEST_API === '1' ? installTestApi(ready, () => overlay.errors()) : null;

async function boot(): Promise<void> {
  const app = document.getElementById('app');
  if (app === null) throw new Error('index.html has no #app element');

  const worker = new Worker(new URL('./sim-worker.ts', import.meta.url), { type: 'module' });
  overlay.attachWorker(worker);
  const host = Comlink.wrap<SimWorker>(worker);

  const hud = new Hud(app);
  const forceWebGL = new URLSearchParams(location.search).get('webgl') === '1';
  const [bodies, renderer] = await Promise.all([host.load(SCENE_ID, SEED), SceneRenderer.create(app, { forceWebGL })]);
  renderer.setBodies(bodies);
  const camera = new OrbitCameraController(renderer.camera, renderer.domElement, {
    target: [0, 0.6, 0],
    distance: 6,
    yaw: 0.65,
    pitch: 0.38,
  });

  let paused = false;
  let timeScale = 1;
  let latest: Float64Array | null = null;
  let latestHash = '';
  let latestHashTick = 0;
  let fps = 0;
  let asMs = 0;
  let pendingSeconds = 0;
  let frameInFlight = false;
  let simFailed = false;
  let replayInFlight: Promise<ReplayCheck> | null = null;
  /** A visible replay started with R (D-003), resolved when the worker reports it done. */
  let visibleReplay: {
    readonly wasPaused: boolean;
    readonly promise: Promise<ReplayCheck>;
    readonly resolve: (check: ReplayCheck) => void;
    readonly reject: (reason: unknown) => void;
  } | null = null;
  const realTime = new RealTimeMonitor();
  let monitorWall = performance.now() / 1000;
  let monitorSim = 0;

  overlay.setContext({
    backend: () => renderer.backend,
    tick: () => latest?.[FRAME_TICK] ?? 0,
    hash: () => latestHash,
  });
  renderer.onDeviceLost = (message) => {
    hud.setNote(message);
  };
  // D-002: recovery replaces the canvas; the camera's input must follow it.
  renderer.onCanvasReplaced = (canvas) => {
    camera.attach(canvas);
  };
  // D-010: when no renderer can be created, say so and keep the simulation running.
  renderer.onRecoveryFailed = (err) => {
    hud.setNote('GPU unavailable: drawing has stopped but the simulation keeps running. Reload the page to try again.');
    overlay.report(err, 'gpu.recovery');
  };

  const setPaused = async (value: boolean): Promise<void> => {
    paused = value;
    await host.setPaused(value);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await setPaused(true);
    hud.setNote('Reduced motion is on: the simulation starts paused. Press Space to run it.');
  }

  const replay = (): Promise<ReplayCheck> => {
    if (replayInFlight !== null) return replayInFlight;
    const wasPaused = paused;
    replayInFlight = (async () => {
      await setPaused(true);
      hud.setReplayStatus('replaying...', 'busy');
      try {
        const result = await host.replay();
        if (result.matches) {
          hud.setReplayStatus(`replay matches: ${result.replayHash}`, 'ok');
        } else {
          hud.setReplayStatus(
            `REPLAY MISMATCH: original ${result.originalHash}, replay ${result.replayHash}`,
            'bad',
          );
        }
        return result;
      } catch (e) {
        hud.setReplayStatus('replay failed: see error report', 'bad');
        throw e;
      } finally {
        replayInFlight = null;
        await setPaused(wasPaused);
      }
    })();
    return replayInFlight;
  };

  /**
   * R (D-003): rebuild the run from its seed and inputs and play it again from
   * the start, visibly, up to the tick where R was pressed; there the worker
   * compares the replay's hash with the original run's hash at that same tick.
   */
  const startVisibleReplay = (): Promise<ReplayCheck> => {
    if (visibleReplay !== null) return visibleReplay.promise;
    let resolve: (check: ReplayCheck) => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    const promise = new Promise<ReplayCheck>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    visibleReplay = { wasPaused: paused, promise, resolve, reject };
    hud.setReplayStatus('replaying from the start...', 'busy');
    realTime.reset();
    (async () => {
      const start = await host.startReplay();
      hud.setReplayStatus(`replaying: tick 0 of ${start.targetTick}`, 'busy');
      await setPaused(false);
    })().catch((err: unknown) => {
      const r = visibleReplay;
      visibleReplay = null;
      hud.setReplayStatus('replay failed: see the error report', 'bad');
      r?.reject(err);
    });
    return promise;
  };

  const onReplayProgress = (p: ReplayProgress | null): void => {
    if (p === null) return;
    if (p.state === 'running') {
      hud.setReplayStatus(`replaying: tick ${p.tick} of ${p.target}`, 'busy');
      return;
    }
    const c = p.check;
    if (c.matches) {
      hud.setReplayStatus(`replay matches the original run at tick ${c.ticks}: ${c.replayHash}`, 'ok');
    } else {
      hud.setReplayStatus(`REPLAY MISMATCH at tick ${c.ticks}: original ${c.originalHash}, replay ${c.replayHash}`, 'bad');
    }
    const r = visibleReplay;
    visibleReplay = null;
    if (r !== null) {
      if (r.wasPaused) void setPaused(true);
      r.resolve(c);
    }
  };

  /** Every frame result goes through here, whether the loop or the test API asked for it. */
  const applyFrameResult = (result: FrameResult): void => {
    latest = result.buffer;
    latestHash = result.hash;
    latestHashTick = result.hashTick;
    asMs = result.buffer[FRAME_AS_STEP_MS] ?? 0;
    onReplayProgress(result.replay);
  };

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') {
      e.preventDefault();
      void setPaused(!paused);
    } else if (e.key === 'r' || e.key === 'R') {
      startVisibleReplay().catch((err: unknown) => overlay.report(err, 'replay'));
    }
  });

  let lastNow = performance.now();
  let lastHud = 0;
  const loop = (now: number): void => {
    const dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    if (dt > 0) fps = fps === 0 ? 1 / dt : fps * 0.9 + (1 / dt) * 0.1;

    pendingSeconds = Math.min(MAX_FRAME_SECONDS, pendingSeconds + dt);
    if (!frameInFlight && !simFailed) {
      frameInFlight = true;
      const seconds = pendingSeconds;
      pendingSeconds = 0;
      host.frame(seconds).then(
        (result) => {
          applyFrameResult(result);
          // D-009: sample the real-time monitor once per completed worker frame, so wall time and
          // simulated time are measured over the same intervals (sampling on a separate timer while
          // simulated time arrives in chunks gave errors of up to 20% over the window).
          const wallNow = performance.now() / 1000;
          const simNow = result.buffer[FRAME_SIM_TIME] ?? 0;
          const active = !paused && visibleReplay === null && !simFailed && !document.hidden;
          realTime.push(wallNow - monitorWall, simNow - monitorSim, timeScale, active);
          monitorWall = wallNow;
          monitorSim = simNow;
          frameInFlight = false;
        },
        (err: unknown) => {
          frameInFlight = false;
          simFailed = true;
          hud.setNote('Simulation stopped after an error: see the error report.');
          overlay.report(err, 'sim.frame');
        },
      );
    }

    camera.update(dt);
    if (latest !== null) renderer.applyFrame(latest);
    renderer.render();

    if (now - lastHud >= HUD_INTERVAL_MS) {
      lastHud = now;
      const simNow = latest?.[FRAME_SIM_TIME] ?? 0;
      hud.update({
        fps,
        asMs,
        tick: latest?.[FRAME_TICK] ?? 0,
        simTime: simNow,
        hash: latestHash,
        hashTick: latestHashTick,
        backend: renderer.backend,
        timeScale,
        belowRealTime: realTime.belowRealTime || (latest?.[FRAME_BELOW_REAL_TIME] ?? 0) === 1,
        achievedRatio: realTime.hasEstimate ? realTime.achievedRatio : null,
        paused,
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  if (attachTestBackend !== null) {
    // Pull the current poses from the worker and apply them now, so a readback
    // straight after step() or loadScene() sees the new state rather than the
    // last frame the loop happened to draw.
    const syncFrame = async (): Promise<void> => {
      const result = await host.frame(0);
      applyFrameResult(result);
      renderer.applyFrame(result.buffer);
    };
    const backend: TestApiBackend = {
      step: async (n) => {
        const tick = await host.step(n);
        await syncFrame();
        return tick;
      },
      loadScene: async (sceneId, seed) => {
        const list = await host.load(sceneId, seed);
        renderer.setBodies(list);
        latestHash = '';
        latestHashTick = 0;
        realTime.reset();
        monitorSim = 0;
        if (visibleReplay !== null) {
          visibleReplay.reject(new Error('scene reloaded during a replay'));
          visibleReplay = null;
        }
        hud.setReplayStatus('press R to replay', 'idle');
        await syncFrame();
      },
      applyInputs: async (cmds) => {
        for (const cmd of cmds) await host.queueInput(cmd);
      },
      getState: () => host.getState(),
      hash: () => host.hash(),
      runReplay: (json) => host.runReplay(parseReplayFile(json)),
      setTimeScale: async (x) => {
        await host.setTimeScale(x);
        timeScale = x;
        realTime.reset();
      },
      pause: () => setPaused(true),
      play: () => setPaused(false),
      replay,
      replayVisible: startVisibleReplay,
      slowAs: (ms) => host.setFrameDelay(ms),
      gpuResources: () => renderer.resourceCounts(),
      asTotals: () => host.asTotals(),
      readPixels: async (x, y, w, h) => {
        await syncFrame();
        return renderer.readPixels(x, y, w, h);
      },
      crashGpu: (options) => {
        if (options?.failRecoveries !== undefined) renderer.failNextRecoveries(options.failRecoveries);
        return renderer.crashDevice();
      },
      backend: () => renderer.backend,
      errors: () => overlay.errors(),
      frameStats: () => ({ fps, asMs }),
    };
    attachTestBackend(backend);
  }
}

boot().then(bootResolve, (err: unknown) => {
  bootReject(err);
  overlay.report(err, 'boot');
});
