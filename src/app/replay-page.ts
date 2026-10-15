// Headless replay harness page (replay.html). No rendering, no WebGPU: the
// simulation runs in the same worker module as the game, so Rapier is bundled
// once, and Playwright compares hashes in Chromium, WebKit and Firefox against
// Node (MASTER 13.1 test:golden). This page must never write to console.error.

import * as Comlink from 'comlink';
import type { SimWorker } from './sim-worker.ts';
import type { ReplayFile, ReplayResult } from '../sim/index.ts';

export interface ReplayHarness {
  readonly ready: Promise<void>;
  run(replayJson: string | ReplayFile): Promise<ReplayResult>;
  runScene(sceneId: string, seed: number, ticks: number, hashEvery?: number): Promise<ReplayResult>;
  engine(): string;
}

declare global {
  interface Window {
    __psReplay?: ReplayHarness;
  }
}

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');

function setStatus(text: string): void {
  if (statusEl !== null) statusEl.textContent = text;
}

function log(text: string): void {
  if (logEl !== null) logEl.textContent = `${logEl.textContent ?? ''}${text}\n`;
}

const worker = new Worker(new URL('./sim-worker.ts', import.meta.url), { type: 'module' });
const host = Comlink.wrap<SimWorker>(worker);

// Loading a scene initialises Rapier inside the worker; after that every call is quick.
const ready = host.load('free-fall', 1).then(
  () => {
    setStatus(`ready - ${navigator.userAgent}`);
  },
  (e: unknown) => {
    setStatus(`failed to initialise the simulation: ${e instanceof Error ? e.message : String(e)}`);
    throw e;
  },
);

const harness: ReplayHarness = {
  ready,
  async run(replayJson) {
    await ready;
    const result = await host.runReplay(replayJson);
    const id = typeof replayJson === 'string' ? (JSON.parse(replayJson) as ReplayFile).scene.id : replayJson.scene.id;
    log(`replay ${id} ticks ${result.ticks}: ${result.finalHash}`);
    return result;
  },
  async runScene(sceneId, seed, ticks, hashEvery = 60) {
    await ready;
    const result = await host.runSceneById(sceneId, seed, ticks, hashEvery);
    log(`scene ${sceneId} seed ${seed} ticks ${result.ticks}: ${result.finalHash}`);
    return result;
  },
  engine: () => navigator.userAgent,
};

window.__psReplay = harness;
