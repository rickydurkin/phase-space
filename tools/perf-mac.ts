// perf:mac (MASTER 13.1): real-GPU performance on Ricky's Mac through headed
// Chrome. Builds the test bundle, serves it, measures frame times and AS cost
// per scene, writes reports/perf-mac.json and docs/BASELINE.md.
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import type { TestApi } from '../src/app/test-api.ts';

declare global {
  interface Window {
    __ps?: TestApi;
  }
}

const SCENES = ['cube-drop', 'stack-1000'];
const SECONDS = Number(process.env['PERF_SECONDS'] ?? 8);

function pct(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
}

async function main(): Promise<void> {
  const build = spawnSync('node', ['tools/build-test.js'], { stdio: 'inherit' });
  if ((build.status ?? 1) !== 0) throw new Error('build:test failed');
  const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-test', '--port', '4176', '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const machine = spawnSync('sysctl', ['-n', 'machdep.cpu.brand_string'], { encoding: 'utf8' }).stdout.trim();
  const results: Record<string, unknown>[] = [];
  const browser = await chromium.launch({
    headless: false,
    channel: process.env['PERF_CHANNEL'] ?? 'chrome',
    args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--window-size=1920,1200'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:4176/');
    await page.waitForFunction(() => window.__ps !== undefined);
    await page.evaluate(() => window.__ps?.ready);
    const backend = await page.evaluate(() => (window.__ps as TestApi).backend());
    const ua = await page.evaluate(() => navigator.userAgent);
    for (const scene of SCENES) {
      await page.evaluate(() => (window.__ps as TestApi).pause());
      await page.evaluate((s) => (window.__ps as TestApi).loadScene(s, 7), scene);
      await page.evaluate(() => (window.__ps as TestApi).play());
      await page.waitForTimeout(1000); // warm up shaders and the first contacts
      const before = await page.evaluate(() => (window.__ps as TestApi).asTotals());
      const frames: number[] = await page.evaluate(
        (seconds) =>
          new Promise<number[]>((resolve) => {
            const deltas: number[] = [];
            let last = performance.now();
            const end = last + seconds * 1000;
            const loop = (): void => {
              const now = performance.now();
              deltas.push(now - last);
              last = now;
              if (now < end) requestAnimationFrame(loop);
              else resolve(deltas);
            };
            requestAnimationFrame(loop);
          }),
        SECONDS,
      );
      const stats = await page.evaluate(() => (window.__ps as TestApi).frameStats());
      const state = await page.evaluate(() => (window.__ps as TestApi).getState());
      const after = await page.evaluate(() => (window.__ps as TestApi).asTotals());
      const simSeconds = (after.ticks - before.ticks) * after.dt;
      const asMsPerSimSecond = simSeconds > 0 ? (after.ms - before.ms) / simSeconds : 0;
      const reference = scene === 'cube-drop';
      const frameBudget = reference ? 8.3 : 16.7;
      const sorted = [...frames].sort((a, b) => a - b);
      const row = {
        scene,
        tier: 'Ultra (P00: single tier)',
        backend,
        frames: frames.length,
        frameMs: { p50: pct(sorted, 0.5), p95: pct(sorted, 0.95), p99: pct(sorted, 0.99) },
        fps: stats.fps,
        asMsPerFrame: frames.length > 0 ? (after.ms - before.ms) / frames.length : 0,
        asMsPerSimulatedSecond: asMsPerSimSecond,
        simulatedSeconds: simSeconds,
        tick: state.tick,
        frameBudgetMs: frameBudget,
        overBudget: [
          ...(pct(sorted, 0.95) > frameBudget ? [`frame p95 over ${frameBudget} ms`] : []),
          ...(asMsPerSimSecond > 300 ? ['AS over 300 ms per simulated second'] : []),
        ],
      };
      results.push(row);
      console.log(JSON.stringify(row));
    }
    const report = { date: new Date().toISOString(), machine, ua, backend, seconds: SECONDS, results };
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/perf-mac.json', JSON.stringify(report, null, 2) + '\n');
    const d = new Date();
    const dd = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const lines = [
      '# Performance baseline',
      '',
      `Written by \`npm run perf:mac\` on ${dd}. Machine: ${machine}. Browser: ${ua.replace(/^.*(Chrome\/[\d.]+).*$/, '$1')} (${backend}), 1920 x 1080 viewport, ${SECONDS} s per scene after 1 s warm-up.`,
      '',
      'Budgets (MASTER 12, M4 Max, Ultra): frame p95 at most 8.3 ms in reference scenes and 16.7 ms in the stress scene; AS at most 300 ms per simulated second at 1x; no tick over 8 ms.',
      '',
      '| Scene | Tier | Frame p50 ms | p95 ms | p99 ms | fps | AS ms per frame | AS ms per simulated second | Budget |',
      '|---|---|---|---|---|---|---|---|---|',
      ...results.map((r) => {
        const x = r as { scene: string; tier: string; frameMs: { p50: number; p95: number; p99: number }; fps: number; asMsPerFrame: number; asMsPerSimulatedSecond: number; overBudget: string[] };
        const budget = x.overBudget.length > 0 ? `over budget: ${x.overBudget.join('; ')}` : 'within budget';
        return `| ${x.scene} | ${x.tier} | ${x.frameMs.p50.toFixed(2)} | ${x.frameMs.p95.toFixed(2)} | ${x.frameMs.p99.toFixed(2)} | ${x.fps.toFixed(0)} | ${x.asMsPerFrame.toFixed(2)} | ${x.asMsPerSimulatedSecond.toFixed(0)} | ${budget} |`;
      }),
      '',
      'Frame intervals come from requestAnimationFrame deltas and are bound by the display refresh (8.33 ms at 120 Hz), so a p50 at the refresh interval means no missed vsync, and a p95 slightly above it is display jitter that still counts against the budget; GPU time per frame is not resolved until timestamp queries arrive in P1. AS cost is the running total kept by the worker over the measured window divided by the simulated seconds advanced, timed with performance.now at 100 microsecond resolution (no cross-origin isolation), so per-frame values are averages. cube-drop is the P00 reference scene; stack-1000 (1,000 cubes) stands in for the stress scene until RS1 to RS5 exist. Raw data: reports/perf-mac.json.',
      '',
    ];
    writeFileSync('docs/BASELINE.md', lines.join('\n'));
    console.log('wrote docs/BASELINE.md');
  } finally {
    await browser.close();
    server.kill();
  }
}

await main();
