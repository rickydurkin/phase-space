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

/** Simulated seconds advanced per wall second times the requested scale, measured by the test itself. */
async function measuredRate(page: Page, seconds: number, timeScale: number): Promise<number> {
  const a = await page.evaluate(() => (window.__ps as TestApi).getState());
  const t0 = Date.now();
  await page.waitForTimeout(seconds * 1000);
  const b = await page.evaluate(() => (window.__ps as TestApi).getState());
  const wall = (Date.now() - t0) / 1000;
  return (b.time - a.time) / (wall * timeScale);
}

test('D-009: in slow motion, time lost to slow frames shows "running below real time" with the achieved rate', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  // At 0.1x a 0.7 s round trip asks for at most 0.5 s x 0.1 = 6 ticks, far under the 48-tick frame
  // budget, so the frame clock never flags anything; the time lost to the per-frame cap is the silent
  // loss D-009 describes, and only the real-time monitor can see it.
  await page.evaluate(() => (window.__ps as TestApi).setTimeScale(0.1));
  await page.evaluate(() => (window.__ps as TestApi).slowAs(700));
  await page.evaluate(() => (window.__ps as TestApi).play());
  await expect.poll(() => badge(page), { timeout: 30_000 }).toContain('running below real time');
  expect(await badge(page)).toContain('of 0.10x');

  // It clears once the simulation keeps up again (slow motion is cheap on any machine).
  await page.evaluate(() => (window.__ps as TestApi).slowAs(0));
  await expect.poll(() => badge(page), { timeout: 30_000 }).toBeNull();
  expect(await page.evaluate(() => (window.__ps as TestApi).errors())).toEqual([]);
  expectCleanConsole(c);
});

test('D-012: frames of 200 ms no longer lose simulated time at 1x', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  // Each round trip takes about 0.2 s: 24 ticks, under the 48-tick budget, so nothing needs dropping.
  // With the old 0.1 s cap the simulation ran at about half speed.
  await page.evaluate(() => (window.__ps as TestApi).slowAs(200));
  await page.evaluate(() => (window.__ps as TestApi).play());
  await page.waitForTimeout(1500);
  const rate = await measuredRate(page, 4, 1);
  console.log(`D-012: measured ${rate.toFixed(2)}x of 1x with 200 ms frames`);
  expect(rate).toBeGreaterThan(0.9);
  expect(await badge(page)).toBeNull();
  await page.evaluate(() => (window.__ps as TestApi).slowAs(0));
  expectCleanConsole(c);
});

test('D-009: the badge tells the truth on this machine (cube-drop at 1x)', async ({ page }) => {
  const c = watchConsole(page);
  await bootGame(page);
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).play());
  // Start-up can run below real time on a slow machine (CI run 3: 0.8 s simulated in the first
  // 1.5 s on SwiftShader), and the badge then rightly shows. The monitor judges over the last
  // second or so, so wait until a whole second has kept up (or a deadline passes on a machine
  // that never does), then let the monitor's window move past start-up before sampling.
  const clock = async (): Promise<{ wall: number; sim: number }> => {
    const s = await page.evaluate(() => (window.__ps as TestApi).getState());
    return { wall: Date.now() / 1000, sim: s.time };
  };
  const startup: string[] = [];
  const deadline = Date.now() + 15_000;
  let a = await clock();
  for (;;) {
    await page.waitForTimeout(1000);
    const next = await clock();
    const r = (next.sim - a.sim) / (next.wall - a.wall);
    startup.push(`${r.toFixed(2)}x${(await badge(page)) === null ? '' : ' (badge)'}`);
    a = next;
    if (r >= 0.97 || Date.now() > deadline) break;
  }
  await page.waitForTimeout(2000); // monitor window (1 s) plus one capped frame (0.5 s) plus margin
  const seen: Array<string | null> = [];
  for (let i = 0; i < 16; i++) {
    seen.push(await badge(page));
    await page.waitForTimeout(250);
  }
  // The rate covers everything the monitor saw while sampling, the 2 s wait included.
  const b = await clock();
  const rate = (b.sim - a.sim) / (b.wall - a.wall);
  const shown = seen.filter((s) => s !== null).length;
  console.log(`D-009 truth: start-up ${startup.join(', ')}`);
  console.log(`D-009 truth: measured ${rate.toFixed(2)}x of 1x; badge shown in ${shown} of ${seen.length} samples`);
  if (rate >= 0.97) expect(shown, 'keeping up, so no badge').toBe(0);
  else if (rate < 0.85) expect(shown, 'below real time, so the badge must say so').toBeGreaterThan(seen.length / 2);
  // Between 0.85 and 0.97 either state is acceptable (hysteresis band).
  expectCleanConsole(c);
});
