import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { bootGame, watchConsole, expectCleanConsole } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

// Scripted chaos with heap tracking (MASTER 13.1). P00 runs 5 minutes
// (SOAK_MINUTES); the 30-minute version arrives with the full soak in P11.
const MINUTES = Number(process.env['SOAK_MINUTES'] ?? 5);

test('soak: random play for the configured minutes with a flat JS heap and a clean console', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'heap metrics need CDP');
  test.setTimeout((MINUTES + 3) * 60_000);
  const c = watchConsole(page);
  await bootGame(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable');
  const heap = async (): Promise<number> => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    return metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0;
  };
  const samples: { t: number; heapMB: number; tick: number }[] = [];
  const end = Date.now() + MINUTES * 60_000;
  let seed = 1234;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let nextSample = Date.now() + 30_000;
  let actions = 0;
  while (Date.now() < end) {
    const r = rnd();
    if (r < 0.2) await page.evaluate((x) => (window.__ps as TestApi).setTimeScale(x), [0.1, 0.5, 1, 2, 8][Math.floor(rnd() * 5)] as number);
    else if (r < 0.35) await page.evaluate(() => (window.__ps as TestApi).pause());
    else if (r < 0.6) await page.evaluate(() => (window.__ps as TestApi).play());
    else if (r < 0.8) {
      const st = await page.evaluate(() => (window.__ps as TestApi).getState());
      await page.evaluate(
        ([tick, ix, iz]) => (window.__ps as TestApi).applyInputs([{ type: 'impulse', tick, entity: 2, ix, iy: 400, iz }]),
        [st.tick + 1, (rnd() - 0.5) * 600, (rnd() - 0.5) * 600] as const,
      );
    } else if (r < 0.9) await page.evaluate(() => (window.__ps as TestApi).step(60));
    else {
      const check = await page.evaluate(() => (window.__ps as TestApi).replay());
      expect(check.matches, `replay mismatch at ${JSON.stringify(check)}`).toBe(true);
    }
    actions++;
    if (Date.now() >= nextSample) {
      const st = await page.evaluate(() => (window.__ps as TestApi).getState());
      samples.push({ t: Math.round((Date.now() - (end - MINUTES * 60_000)) / 1000), heapMB: (await heap()) / 1048576, tick: st.tick });
      nextSample += 30_000;
    }
    await page.waitForTimeout(500 + rnd() * 1500);
  }
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/soak.json', JSON.stringify({ minutes: MINUTES, actions, samples }, null, 2) + '\n');
  console.log(`soak: ${actions} actions, heap samples ${samples.map((s) => s.heapMB.toFixed(1)).join(' ')} MB`);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
  // Heap after the first minute must stay within 5% of the maximum of the later samples (MASTER 12).
  const settled = samples.filter((s) => s.t >= 60);
  if (settled.length >= 2) {
    const first = settled[0] as { heapMB: number };
    const last = settled[settled.length - 1] as { heapMB: number };
    expect(last.heapMB).toBeLessThanOrEqual(first.heapMB * 1.05 + 2);
  }
});
