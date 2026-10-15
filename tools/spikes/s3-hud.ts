// Spike S3 runner: builds the HUD benchmark page, serves it, drives it in
// headless Chromium and measures main-thread cost per update through CDP.
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const SECONDS = Number(process.env['S3_SECONDS'] ?? 10);
const build = spawnSync('npx', ['vite', 'build', '--config', 'tools/spikes/s3-hud/vite.config.js'], { stdio: 'inherit' });
if ((build.status ?? 1) !== 0) throw new Error('spike page build failed');
const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-spike-s3', '--port', '4175', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ headless: true });
const rows: Record<string, unknown>[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:4175/');
  await page.waitForFunction(() => (window as unknown as { __s3?: unknown }).__s3 !== undefined);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async (): Promise<Record<string, number>> => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  };
  for (const variant of ['react', 'preact', 'react', 'preact']) {
    const before = await metrics();
    const r = (await page.evaluate(
      ([v, s]) => (window as unknown as { __s3: { runVariant: (v: string, s: number) => Promise<Record<string, number | string>> } }).__s3.runVariant(v as string, s as number),
      [variant, SECONDS] as const,
    )) as Record<string, number | string>;
    const after = await metrics();
    const updates = Number(r['updates']);
    const d = (k: string): number => ((after[k] ?? 0) - (before[k] ?? 0)) * 1000; // seconds to ms
    const row = {
      variant,
      readouts: r['readouts'],
      hz: r['hz'],
      updates,
      mainThreadMsPerUpdate: d('TaskDuration') / updates,
      scriptMsPerUpdate: d('ScriptDuration') / updates,
      layoutMsPerUpdate: d('LayoutDuration') / updates,
      styleMsPerUpdate: d('RecalcStyleDuration') / updates,
      syncMsPerUpdate: r['syncMsPerUpdate'],
      jsHeapMB: (after['JSHeapUsedSize'] ?? 0) / 1048576,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
} finally {
  await browser.close();
  server.kill();
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/spike-s3.json', JSON.stringify({ date: new Date().toISOString(), seconds: SECONDS, rows }, null, 2) + '\n');
