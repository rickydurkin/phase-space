import { test, expect } from '@playwright/test';
import { bootGame, watchConsole, expectCleanConsole, findCube } from './helpers.ts';
import type { Page } from '@playwright/test';

/** readPixels throws while the renderer is rebuilding; treat that as "not yet". */
async function cubeVisible(page: Page): Promise<boolean> {
  try {
    return (await findCube(page)).found;
  } catch {
    return false;
  }
}
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
  await expect.poll(() => cubeVisible(page), { timeout: 30_000, intervals: [500] }).toBe(true);

  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.tick).toBe(before.tick);
  expect(after.hash).toBe(before.hash);
  await page.evaluate(() => (window.__ps as TestApi).step(60));
  expect((await page.evaluate(() => (window.__ps as TestApi).getState())).tick).toBe(before.tick + 60);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-001: GPU process crash through the DevTools protocol leaves no unhandled rejection and the state intact', async ({ page, browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP is Chromium only');
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).step(120));
  const before = await page.evaluate(() => (window.__ps as TestApi).getState());
  const session = await browser.newBrowserCDPSession();
  await session.send('Browser.crashGpuProcess');
  await page.waitForTimeout(2000);
  await expect.poll(() => cubeVisible(page), { timeout: 30_000, intervals: [500] }).toBe(true);
  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.hash).toBe(before.hash);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  // Chromium itself warns about the instance loss when its GPU process is killed on purpose here.
  // Since D-001 is fixed, no page error is tolerated.
  expectCleanConsole(c, [/A valid external Instance reference no longer exists/]);
});
