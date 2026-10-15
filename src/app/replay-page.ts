// Headless replay harness page (replay.html). No rendering, no WebGPU: the
// simulation runs on this page's main thread so Playwright can compare hashes
// in Chromium, WebKit and Firefox against Node (MASTER 13.1 test:golden).
// This page must never write to console.error.

import { getScene, runScene, runReplay, initRapier } from '../sim/index.ts';
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

function parseReplay(replayJson: string | ReplayFile): ReplayFile {
  const value: unknown = typeof replayJson === 'string' ? JSON.parse(replayJson) : replayJson;
  if (typeof value !== 'object' || value === null) throw new Error('replay must be a JSON object');
  const r = value as Partial<ReplayFile>;
  if (
    typeof r.format !== 'number' ||
    typeof r.seed !== 'number' ||
    typeof r.ticks !== 'number' ||
    typeof r.hashEvery !== 'number' ||
    typeof r.scene !== 'object' ||
    r.scene === null ||
    typeof r.scene.id !== 'string' ||
    typeof r.scene.version !== 'number' ||
    !Array.isArray(r.inputs)
  ) {
    throw new Error('replay is missing format, scene, seed, ticks, hashEvery or inputs');
  }
  return r as ReplayFile;
}

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');

function setStatus(text: string): void {
  if (statusEl !== null) statusEl.textContent = text;
}

function log(text: string): void {
  if (logEl !== null) logEl.textContent = `${logEl.textContent ?? ''}${text}\n`;
}

const ready = initRapier().then(
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
    const replay = parseReplay(replayJson);
    const result = await runReplay(replay);
    log(`replay ${replay.scene.id} seed ${replay.seed} ticks ${result.ticks}: ${result.finalHash}`);
    return result;
  },
  async runScene(sceneId, seed, ticks, hashEvery = 60) {
    await ready;
    const { result } = await runScene(getScene(sceneId), seed, ticks, [], hashEvery);
    log(`scene ${sceneId} seed ${seed} ticks ${result.ticks}: ${result.finalHash}`);
    return result;
  },
  engine: () => navigator.userAgent,
};

window.__psReplay = harness;
