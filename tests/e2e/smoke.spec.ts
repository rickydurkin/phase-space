import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { bootGame, watchConsole, expectCleanConsole, findCube } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

// Session-start smoke (MASTER 13.1): boot, first interaction, zero console errors.
test('boots within 30 s, the cube is visible by pixel readback, the simulation advances, console is clean', async ({ page }, info) => {
  const c = watchConsole(page);
  const bootMs = await bootGame(page);
  console.log(`boot ${bootMs} ms, backend ${await page.evaluate(() => (window.__ps as TestApi).backend())}`);
  expect(bootMs).toBeLessThan(30_000);

  // Freeze the simulation early in the fall so the cube hangs in the middle of the view.
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).step(20));
  const cube = await findCube(page);
  console.log(`cube ${cube.found ? 'found' : 'not found'} at y=${cube.at}, colour ${JSON.stringify(cube.colour)}`);
  expect(cube.found, `cube not found; brightest sample ${JSON.stringify(cube.colour)}`).toBe(true);
  mkdirSync('reports/screenshots', { recursive: true });
  await page.screenshot({ path: `reports/screenshots/smoke-${info.project.name}.png` });

  // The simulation advances when playing.
  await page.evaluate(() => (window.__ps as TestApi).play());
  const t0 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  await page.waitForTimeout(1000);
  const t1 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  expect(t1).toBeGreaterThan(t0 + 30);

  // Replay from inside the page: hashes must match.
  const check = await page.evaluate(() => (window.__ps as TestApi).replay());
  expect(check.matches, JSON.stringify(check)).toBe(true);

  const apiErrors = await page.evaluate(() => (window.__ps as TestApi).errors());
  expect(apiErrors).toEqual([]);
  expectCleanConsole(c);
});
