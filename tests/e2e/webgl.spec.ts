import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bootGame, watchConsole, expectCleanConsole, findCube } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';
import type { ReplayFile } from '../../src/sim/index.ts';

const golden = JSON.parse(readFileSync(new URL('../golden/cube-drop.golden.json', import.meta.url), 'utf8')) as ReplayFile;

test('the WebGL2 fallback boots, draws the cube and simulates identically', async ({ page }) => {
  const c = watchConsole(page);
  const bootMs = await bootGame(page, '?webgl=1');
  expect(bootMs).toBeLessThan(30_000);
  expect(await page.evaluate(() => (window.__ps as TestApi).backend())).toBe('WebGL2');
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).step(20));
  expect((await findCube(page)).found).toBe(true);
  await page.evaluate(() => (window.__ps as TestApi).step(580));
  const hash = await page.evaluate(() => (window.__ps as TestApi).hash());
  expect(hash).toBe(golden.hashes.find((h) => h.tick === 600)?.hash);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});
