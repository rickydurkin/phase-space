import { test, expect } from '@playwright/test';
import { bootGame, watchConsole, expectCleanConsole, findCube } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

test('WebGPU device loss recovers with the simulation state intact', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebGPU device-loss test runs in Chromium');
  const c = watchConsole(page);
  await bootGame(page);
  const backend = await page.evaluate(() => (window.__ps as TestApi).backend());
  test.skip(backend !== 'WebGPU', `backend is ${backend}; no WebGPU device to lose`);

  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).step(300));
  const before = await page.evaluate(() => (window.__ps as TestApi).getState());

  const crashed = await page.evaluate(() => (window.__ps as TestApi).crashGpu());
  expect(crashed).toBe(true);
  // Recovery is asynchronous: wait until the renderer draws the cube again.
  await expect.poll(async () => (await findCube(page)).found, { timeout: 30_000 }).toBe(true);

  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.tick).toBe(before.tick);
  expect(after.hash).toBe(before.hash);
  await page.evaluate(() => (window.__ps as TestApi).step(60));
  expect((await page.evaluate(() => (window.__ps as TestApi).getState())).tick).toBe(before.tick + 60);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('GPU process crash through the DevTools protocol does not break the page', async ({ page, browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP is Chromium only');
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).step(120));
  const before = await page.evaluate(() => (window.__ps as TestApi).getState());
  const session = await browser.newBrowserCDPSession();
  await session.send('Browser.crashGpuProcess');
  await page.waitForTimeout(2000);
  await expect.poll(async () => (await findCube(page)).found, { timeout: 30_000 }).toBe(true);
  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.hash).toBe(before.hash);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});
