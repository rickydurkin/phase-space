import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { bootGame, watchConsole, expectCleanConsole } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

const CUBE = 2; // entity id of the cube in cube-drop

async function replayText(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('.ps-replay')?.textContent ?? '');
}

async function hashRow(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('.ps-v[data-k="hash"]')?.textContent ?? '');
}

async function cubeHeight(page: Page): Promise<number> {
  const s = await page.evaluate(() => (window.__ps as TestApi).getState());
  return s.bodies.find((b) => b.id === CUBE)?.p[1] ?? Number.NaN;
}

test('D-003: R replays the run visibly from the start and compares hashes at the same tick', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).step(400)); // the cube has landed and settled
  const original = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(original.tick).toBe(400);
  expect(await cubeHeight(page)).toBeLessThan(0.6);
  // While paused, the hash row shows the exact hash of the current tick and says which tick it is.
  await expect.poll(() => hashRow(page)).toBe(`${original.hash} @ 400`);

  await page.keyboard.press('r');
  // The cube is visibly back in the air during the replay.
  let highest = 0;
  for (let i = 0; i < 25; i++) {
    highest = Math.max(highest, await cubeHeight(page));
    await page.waitForTimeout(100);
  }
  expect(highest, 'the replay shows the fall again').toBeGreaterThan(1.5);

  await expect.poll(() => replayText(page), { timeout: 30_000 }).toContain('replay matches the original run at tick 400');
  expect(await replayText(page)).toContain(original.hash);
  // It was paused before R, so it ends paused at the same tick with the same state.
  const after = await page.evaluate(() => (window.__ps as TestApi).getState());
  expect(after.tick).toBe(400);
  expect(after.hash).toBe(original.hash);
  await expect.poll(() => hashRow(page)).toBe(`${original.hash} @ 400`);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-003: a replay while running, with an input in the log, matches and carries on running', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() =>
    (window.__ps as TestApi).applyInputs([{ type: 'impulse', tick: 200, entity: 2, ix: 300, iy: 2500, iz: -200 }]),
  );
  await page.evaluate(() => (window.__ps as TestApi).play());
  await expect.poll(async () => (await page.evaluate(() => (window.__ps as TestApi).getState())).tick, { timeout: 30_000 }).toBeGreaterThan(700);
  const check = await page.evaluate(() => (window.__ps as TestApi).replayVisible());
  expect(check.matches, JSON.stringify(check)).toBe(true);
  expect(check.ticks).toBeGreaterThan(700);
  expect(await replayText(page)).toContain(`replay matches the original run at tick ${check.ticks}: ${check.replayHash}`);
  // Still running afterwards.
  const t0 = (await page.evaluate(() => (window.__ps as TestApi).getState())).tick;
  await page.waitForTimeout(600);
  expect((await page.evaluate(() => (window.__ps as TestApi).getState())).tick).toBeGreaterThan(t0);
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});
