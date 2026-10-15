import { Worker } from 'node:worker_threads';
import type { ReplayFile, ReplayResult } from '../../../src/sim/index.ts';

export interface WorkerOutcome {
  ok: boolean;
  result?: ReplayResult;
  threw?: boolean;
  error?: string;
  calls: string[];
  /** performance.now reads from Rapier's internal profiler, answered with a constant 0. */
  inertTimerReads?: number;
}

/** Run a replay inside a worker with the throwing stubs installed. */
export function runInStubbedWorker(job: { mode: 'replay'; replay: ReplayFile } | { mode: 'probe' }): Promise<WorkerOutcome> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./worker.ts', import.meta.url), { workerData: job });
    w.once('message', (m: WorkerOutcome) => {
      resolve(m);
      void w.terminate();
    });
    w.once('error', reject);
  });
}
