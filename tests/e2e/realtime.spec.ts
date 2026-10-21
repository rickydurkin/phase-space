import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { bootGame, watchConsole, expectCleanConsole } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

async function badge(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.ps-badge');
    return el === null || el.hidden ? null : (el.textContent ?? '');
  });
}

test('D-009: the HUD says "running below real time" when the simulation cannot keep up, and clears when it can', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  // At 1x each worker round trip is handed at most 0.1 s (12 ticks), far under the 48-tick frame
  // budget, so the frame clock never flags anything. Making each round trip take 0.15 s means the
  // simulation runs at about two thirds of real time: the silent loss D-009 describes.
  await page.evaluate(() => (window.__ps as TestApi).slowAs(150));
  await page.evaluate(() => (window.__ps as TestApi).play());
  await expect.poll(() => badge(page), { timeout: 20_000 }).toContain('running below real time');
  await expect.poll(() => badge(page), { timeout: 10_000 }).toMatch(/running below real time: 0\.[4-8]\dx of 1x/);

  // It clears once the simulation keeps up again.
  await page.evaluate(() => (window.__ps as TestApi).slowAs(0));
  await expect.poll(() => badge(page), { timeout: 20_000 }).toBeNull();
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-009 negative control: cube-drop at 1x never shows the badge', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).play());
  for (let i = 0; i < 24; i++) {
    expect(await badge(page), `sample ${i}`).toBeNull();
    await page.waitForTimeout(250);
  }
  expectCleanConsole(c);
});
