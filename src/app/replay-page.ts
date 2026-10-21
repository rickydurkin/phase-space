// Headless replay harness page (replay.html). No rendering, no WebGPU: the
// simulation runs in the same worker module as the game, so Rapier is bundled
// once, and Playwright compares hashes in Chromium, WebKit and Firefox against
// Node (MASTER 13.1 test:golden). This page must never write to console.error.

import * as Comlink from 'comlink';
import type { SimWorker } from './sim-worker.ts';
import { parseReplayFile } from './replay-validate.ts';
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
    const result = await host.runReplay(parseReplayFile(replayJson));
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

// Test builds only: ?auto=golden runs the golden replay served by tools/engine-check.ts
// and posts the result back to it, so the real Chrome, Safari and Firefox on Ricky's
// Mac can be checked without browser automation (P00 gate item 2).
if (import.meta.env.VITE_TEST_API === '1') {
  const params = new URLSearchParams(location.search);
  if (params.get('auto') === 'golden') void autoGolden(params.get('nonce') ?? '');
}

async function autoGolden(nonce: string): Promise<void> {
  const report = async (body: Record<string, unknown>): Promise<void> => {
    await fetch('/__engine-result', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nonce, ua: navigator.userAgent, ...body }),
    });
  };
  try {
    setStatus('running the golden replay in this browser...');
    const golden = (await (await fetch('/__golden.json')).json()) as ReplayFile;
    const result = await harness.run(golden);
    let divergence: { tick: number; expected: string; actual: string } | null = null;
    for (let i = 0; i < golden.hashes.length; i++) {
      const e = golden.hashes[i];
      const a = result.hashes[i];
      if (e === undefined || a === undefined || e.tick !== a.tick || e.hash !== a.hash) {
        divergence = { tick: e?.tick ?? -1, expected: e?.hash ?? '', actual: a?.hash ?? 'missing' };
        break;
      }
    }
    const matches = divergence === null && result.hashes.length === golden.hashes.length;
    setStatus(
      matches
        ? `golden replay matches in this browser: ${result.finalHash} (${result.hashes.length} samples). You can close this tab.`
        : `GOLDEN REPLAY DIFFERS in this browser at tick ${divergence?.tick}: expected ${divergence?.expected}, got ${divergence?.actual}`,
    );
    await report({ matches, finalHash: result.finalHash, samples: result.hashes.length, divergence });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setStatus(`golden replay failed: ${message}`);
    await report({ matches: false, error: message });
  }
}
