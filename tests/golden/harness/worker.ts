// Golden-run worker: installs throwing stubs for everything src/sim may not
// use, then runs a replay. Stubbing the whole test process would break the
// test runner, hence a worker_threads worker (MASTER 5.4).
import { parentPort, workerData } from 'node:worker_threads';

const ALLOWED = new Set([
  'sqrt', 'abs', 'min', 'max', 'floor', 'ceil', 'round', 'sign', 'fround', 'trunc', 'imul', 'clz32',
]);

const calls: string[] = [];
let inertTimerReads = 0;
function recordAndThrow(name: string): () => never {
  return () => {
    calls.push(name);
    throw new Error(`${name} was called inside the authoritative simulation`);
  };
}

export function installStubs(): void {
  const m = Math as unknown as Record<string, unknown>;
  for (const name of Object.getOwnPropertyNames(Math)) {
    if (typeof m[name] === 'function' && !ALLOWED.has(name)) m[name] = recordAndThrow(`Math.${name}`);
  }
  const g = globalThis as unknown as Record<string, unknown>;
  const DateStub = function DateStub(): never {
    throw new Error('Date was constructed inside the authoritative simulation');
  } as unknown as Record<string, unknown>;
  DateStub['now'] = recordAndThrow('Date.now');
  g['Date'] = DateStub;
  // Rapier reads performance.now for its own step timing statistics (world.timingStep()).
  // The value never enters the physics, so that caller gets a constant 0; anything else throws.
  (globalThis.performance as unknown as Record<string, unknown>)['now'] = () => {
    const stack = new Error().stack ?? '';
    if (stack.includes('rapier3d-deterministic-compat')) {
      inertTimerReads++;
      return 0;
    }
    calls.push('performance.now');
    throw new Error('performance.now was called inside the authoritative simulation');
  };
  if (globalThis.crypto !== undefined) {
    (globalThis.crypto as unknown as Record<string, unknown>)['getRandomValues'] = recordAndThrow(
      'crypto.getRandomValues',
    );
  }
}

interface Job {
  mode: 'replay' | 'probe';
  replay?: unknown;
}

installStubs();
const job = workerData as Job;
try {
  if (job.mode === 'probe') {
    // Prove the stubs are active: Math.sin must throw.
    let threw = false;
    try {
      Math.sin(1);
    } catch {
      threw = true;
    }
    parentPort?.postMessage({ ok: true, threw, calls });
  } else {
    const { runReplay } = await import('../../../src/sim/index.ts');
    const result = await runReplay(job.replay as Parameters<typeof runReplay>[0]);
    parentPort?.postMessage({ ok: true, result, calls, inertTimerReads });
  }
} catch (err) {
  parentPort?.postMessage({ ok: false, error: String(err instanceof Error ? err.stack ?? err.message : err), calls });
}
