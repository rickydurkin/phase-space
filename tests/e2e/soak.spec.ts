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
  const samples: { t: number; heapMB: number; tick: number; geometries: number; textures: number }[] = [];
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
        [st.tick + 120, (rnd() - 0.5) * 600, (rnd() - 0.5) * 600] as const, // stamped a second ahead so the worker has not passed it
      );
    } else if (r < 0.88) await page.evaluate(() => (window.__ps as TestApi).step(60));
    else if (r < 0.92) {
      // What R does: a visible replay from the start (D-003).
      const check = await page.evaluate(() => (window.__ps as TestApi).replayVisible());
      expect(check.matches, `visible replay mismatch at ${JSON.stringify(check)}`).toBe(true);
    } else {
      const check = await page.evaluate(() => (window.__ps as TestApi).replay());
      expect(check.matches, `replay mismatch at ${JSON.stringify(check)}`).toBe(true);
    }
    actions++;
    if (Date.now() >= nextSample) {
      const st = await page.evaluate(() => (window.__ps as TestApi).getState());
      const gpu = await page.evaluate(() => (window.__ps as TestApi).gpuResources());
      samples.push({
        t: Math.round((Date.now() - (end - MINUTES * 60_000)) / 1000),
        heapMB: (await heap()) / 1048576,
        tick: st.tick,
        geometries: gpu.geometries,
        textures: gpu.textures,
      });
      nextSample += 30_000;
    }
    await page.waitForTimeout(500 + rnd() * 1500);
  }
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/soak.json', JSON.stringify({ minutes: MINUTES, actions, samples }, null, 2) + '\n');
  console.log(`soak: ${actions} actions, heap samples ${samples.map((s) => s.heapMB.toFixed(2)).join(' ')} MB, GPU geometries ${samples.map((s) => s.geometries).join(' ')}, textures ${samples.map((s) => s.textures).join(' ')}`);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
  // MASTER 12: JS heap and live GPU resource counts flat within 5% (D-006). After the first
  // minute of warm-up, the spread of the samples (largest minus smallest) must stay within 5%
  // of the smallest; GPU counts are small integers, so 5% means they must not change at all.
  const settled = samples.filter((s) => s.t >= 60);
  expect(settled.length, 'need at least two settled samples').toBeGreaterThanOrEqual(2);
  const flat = (values: number[], what: string): void => {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    expect(hi - lo, `${what}: ${values.join(', ')}`).toBeLessThanOrEqual(0.05 * lo);
  };
  flat(settled.map((s) => s.heapMB), 'JS heap MB');
  flat(settled.map((s) => s.geometries), 'GPU geometries');
  flat(settled.map((s) => s.textures), 'GPU textures');
});
