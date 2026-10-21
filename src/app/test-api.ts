// window.__ps: the Playwright test API (MASTER 13.2). Installed by main.ts only
// when import.meta.env.VITE_TEST_API === '1'; production builds never call
// installTestApi, so the global does not exist there.

import type { InputCommand, ReplayFile, ReplayResult } from '../sim/index.ts';
import type { SimState, ReplayCheck } from './protocol.ts';

export interface CrashOptions {
  /** Make the next n renderer creations during recovery fail (D-010 tests). */
  readonly failRecoveries?: number;
}

export interface FrameStats {
  readonly fps: number;
  readonly asMs: number;
}

/** What the running app gives the test API once boot has finished. */
export interface TestApiBackend {
  step(n: number): Promise<number>;
  loadScene(sceneId: string, seed: number): Promise<void>;
  applyInputs(cmds: readonly InputCommand[]): Promise<void>;
  getState(): Promise<SimState>;
  hash(): Promise<string>;
  runReplay(replayJson: string | ReplayFile): Promise<ReplayResult>;
  setTimeScale(x: number): Promise<void>;
  pause(): Promise<void>;
  play(): Promise<void>;
  replay(): Promise<ReplayCheck>;
  /** What R does: replay visibly from the start and compare at the current tick (D-003). */
  replayVisible(): Promise<ReplayCheck>;
  /** Make every running worker frame take this many extra milliseconds (D-009 tests). */
  slowAs(ms: number): Promise<void>;
  readPixels(x: number, y: number, w: number, h: number): Promise<Uint8Array>;
  crashGpu(options?: CrashOptions): boolean;
  backend(): string;
  errors(): string[];
  frameStats(): FrameStats;
}

export interface TestApi {
  readonly ready: Promise<void>;
  step(n: number): Promise<number>;
  loadScene(sceneId: string, seed: number): Promise<void>;
  applyInputs(cmds: readonly InputCommand[]): Promise<void>;
  getState(): Promise<SimState>;
  hash(): Promise<string>;
  runReplay(replayJson: string | ReplayFile): Promise<ReplayResult>;
  setTimeScale(x: number): Promise<void>;
  pause(): Promise<void>;
  play(): Promise<void>;
  replay(): Promise<ReplayCheck>;
  /** What R does: replay visibly from the start and compare at the current tick (D-003). */
  replayVisible(): Promise<ReplayCheck>;
  /** Make every running worker frame take this many extra milliseconds (D-009 tests). */
  slowAs(ms: number): Promise<void>;
  readPixels(x: number, y: number, w: number, h: number): Promise<Uint8Array>;
  crashGpu(options?: CrashOptions): Promise<boolean>;
  backend(): string;
  errors(): string[];
  frameStats(): FrameStats;
}

declare global {
  interface Window {
    __ps?: TestApi;
  }
}

/**
 * Install window.__ps immediately so tests can await `ready`; every call waits
 * for boot to finish before touching the app. `errors` works from the start.
 */
export function installTestApi(ready: Promise<void>, errors: () => string[]): (backend: TestApiBackend) => void {
  let impl: TestApiBackend | null = null;
  const get = async (): Promise<TestApiBackend> => {
    await ready;
    if (impl === null) throw new Error('test API backend missing after boot');
    return impl;
  };
  const api: TestApi = {
    ready,
    step: async (n) => (await get()).step(n),
    loadScene: async (id, seed) => (await get()).loadScene(id, seed),
    applyInputs: async (cmds) => (await get()).applyInputs(cmds),
    getState: async () => (await get()).getState(),
    hash: async () => (await get()).hash(),
    runReplay: async (json) => (await get()).runReplay(json),
    setTimeScale: async (x) => (await get()).setTimeScale(x),
    pause: async () => (await get()).pause(),
    play: async () => (await get()).play(),
    replay: async () => (await get()).replay(),
    replayVisible: async () => (await get()).replayVisible(),
    slowAs: async (ms) => (await get()).slowAs(ms),
    readPixels: async (x, y, w, h) => (await get()).readPixels(x, y, w, h),
    crashGpu: async (options) => (await get()).crashGpu(options),
    backend: () => impl?.backend() ?? 'not ready',
    errors,
    frameStats: () => impl?.frameStats() ?? { fps: 0, asMs: 0 },
  };
  window.__ps = api;
  return (backend) => {
    impl = backend;
  };
}
