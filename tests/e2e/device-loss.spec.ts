import { test, expect } from '@playwright/test';
import { bootGame, watchConsole, expectCleanConsole, findCube, readRegion, meanColour, canvasSize } from './helpers.ts';
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

/** A coarse picture of the current view: mean colour of five 8 x 8 patches (paused scene, so only the camera changes it). */
async function viewSignature(page: Page): Promise<number[]> {
  const { w, h } = await canvasSize(page);
  const points: Array<[number, number]> = [
    [0.5, 0.5],
    [0.3, 0.4],
    [0.7, 0.4],
    [0.35, 0.7],
    [0.65, 0.7],
  ];
  const out: number[] = [];
  for (const [fx, fy] of points) {
    const px = await readRegion(page, Math.floor(w * fx) - 4, Math.floor(h * fy) - 4, 8, 8);
    const m = meanColour(px, 8, 8);
    out.push(m.r, m.g, m.b);
  }
  return out;
}

function difference(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += Math.abs((a[i] as number) - (b[i] as number));
  return d;
}

/** Drag across the live canvas with the mouse (orbit). */
async function orbitDrag(page: Page): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  if (box === null) throw new Error('no canvas on the page');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Horizontal only: a yaw orbit keeps the cube in the centre strip that cubeVisible scans.
  await page.mouse.move(x + 220, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800); // the camera eases towards its goal
}

/** True once readPixels works again, that is the renderer has been rebuilt. */
async function readable(page: Page): Promise<boolean> {
  try {
    await readRegion(page, 0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

async function canvasCount(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('canvas').length);
}

async function hudNote(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('.ps-note')?.textContent ?? '');
}

test('D-002: the orbit camera still responds after device-loss recovery', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebGPU device-loss test runs in Chromium');
  const c = watchConsole(page);
  await bootGame(page);
  test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs a WebGPU device to lose');
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).step(20));

  // Control: orbiting before the loss changes the view.
  const v0 = await viewSignature(page);
  await orbitDrag(page);
  const v1 = await viewSignature(page);
  expect(difference(v0, v1), 'orbit before the loss').toBeGreaterThan(30);

  expect(await page.evaluate(() => (window.__ps as TestApi).crashGpu())).toBe(true);
  await expect.poll(() => hudNote(page), { timeout: 30_000 }).toContain('recovered');
  await expect.poll(() => readable(page), { timeout: 30_000, intervals: [500] }).toBe(true);

  const v2 = await viewSignature(page);
  await orbitDrag(page);
  const v3 = await viewSignature(page);
  expect(difference(v2, v3), 'orbit after recovery').toBeGreaterThan(30);
  expect(await canvasCount(page)).toBe(1);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-010: recovery retries after failed attempts and keeps exactly one canvas', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebGPU device-loss test runs in Chromium');
  const c = watchConsole(page);
  await bootGame(page);
  test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs a WebGPU device to lose');
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).step(20));
  expect(await page.evaluate(() => (window.__ps as TestApi).crashGpu({ failRecoveries: 2 }))).toBe(true);
  // While the failed attempts run, the old canvas must stay on the page.
  for (let i = 0; i < 5; i++) {
    expect(await canvasCount(page)).toBe(1);
    await page.waitForTimeout(300);
  }
  await expect.poll(() => hudNote(page), { timeout: 30_000 }).toContain('recovered on WebGPU');
  expect(await hudNote(page)).toContain('2 failed attempts');
  await expect.poll(() => cubeVisible(page), { timeout: 30_000, intervals: [500] }).toBe(true);
  expect(await canvasCount(page)).toBe(1);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-010: when WebGPU cannot be recreated the game falls back to WebGL2', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebGPU device-loss test runs in Chromium');
  const c = watchConsole(page);
  await bootGame(page);
  test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs a WebGPU device to lose');
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).step(20));
  const before = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(await page.evaluate(() => (window.__ps as TestApi).crashGpu({ failRecoveries: 3 }))).toBe(true);
  await expect.poll(() => hudNote(page), { timeout: 30_000 }).toContain('recovered on WebGL2');
  expect(await page.evaluate(() => (window.__ps as TestApi).backend())).toBe('WebGL2');
  await expect.poll(() => cubeVisible(page), { timeout: 30_000, intervals: [500] }).toBe(true);
  expect(await canvasCount(page)).toBe(1);
  expect((await page.evaluate(() => (window.__ps as TestApi).getState())).hash).toBe(before.hash);
  // The camera still works on the WebGL2 canvas too.
  const v0 = await viewSignature(page);
  await orbitDrag(page);
  expect(difference(v0, await viewSignature(page))).toBeGreaterThan(30);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-010: when every attempt fails the page says so, keeps its canvas and the simulation keeps running', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebGPU device-loss test runs in Chromium');
  test.setTimeout(60_000);
  const c = watchConsole(page);
  await bootGame(page);
  test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs a WebGPU device to lose');
  expect(await page.evaluate(() => (window.__ps as TestApi).crashGpu({ failRecoveries: 10 }))).toBe(true);
  await expect.poll(() => hudNote(page), { timeout: 30_000 }).toContain('GPU unavailable');
  expect(await canvasCount(page)).toBe(1);
  // The failure is reported, once, through the error overlay (not swallowed).
  const errors = await page.evaluate(() => (window.__ps as TestApi).errors());
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('recovery failed after 4 attempts');
  // The simulation is unaffected: it is still running (this test never pauses it), so the tick
  // keeps advancing on its own, and it still steps on request and hashes.
  const t0 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  await page.waitForTimeout(500);
  const t1 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  expect(t1, 'running after the failed recovery').toBeGreaterThan(t0 + 30);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  const t2 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  await page.evaluate(() => (window.__ps as TestApi).step(30));
  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.tick).toBe(t2 + 30);
  expect(after.hash).toMatch(/^[0-9a-f]{16}$/);
  // The reported error is the expected one; nothing else may reach the console.
  c.errors.splice(0, c.errors.length, ...c.errors.filter((e) => !/recovery failed after 4 attempts|\[gpu\.recovery\]/.test(e)));
  expectCleanConsole(c);
});
