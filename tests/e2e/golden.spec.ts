import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { watchConsole, expectCleanConsole } from './helpers.ts';
import type { ReplayHarness } from '../../src/app/replay-page.ts';
import type { ReplayFile, ReplayResult } from '../../src/sim/index.ts';
import { runScene, getScene, firstDivergence } from '../../src/sim/index.ts';

declare global {
  interface Window {
    __psReplay?: ReplayHarness;
  }
}

const golden = JSON.parse(readFileSync(new URL('../golden/cube-drop.golden.json', import.meta.url), 'utf8')) as ReplayFile;

function recordEngine(project: string, data: Record<string, unknown>): void {
  mkdirSync('reports', { recursive: true });
  const path = 'reports/engines.json';
  const all = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>) : {};
  all[project] = { ...data, date: new Date().toISOString() };
  writeFileSync(path, JSON.stringify(all, null, 2) + '\n');
}

test.describe('golden replay across JavaScript engines', () => {
  test('cube-drop replays to the golden hashes in this engine', async ({ page }, info) => {
    const c = watchConsole(page);
    await page.goto('/replay.html');
    await page.waitForFunction(() => window.__psReplay !== undefined);
    await page.evaluate(() => window.__psReplay?.ready);
    const engine = await page.evaluate(() => ({ ua: navigator.userAgent, webgpu: 'gpu' in navigator }));
    const result: ReplayResult = await page.evaluate((g) => (window.__psReplay as ReplayHarness).run(g), golden);
    const d = firstDivergence(golden.hashes, result.hashes);
    recordEngine(info.project.name, { ...engine, cubeDropFinal: result.finalHash, matchesGolden: d === null });
    expect(d, `diverged in ${info.project.name}: ${JSON.stringify(d)}`).toBeNull();
    expect(result.finalHash).toBe(golden.hashes[golden.hashes.length - 1]?.hash);
    expectCleanConsole(c);
  });

  test('stack-1000 (spike S1) gives the same hash as Node after 120 ticks', async ({ page }, info) => {
    test.slow();
    const c = watchConsole(page);
    const node = await runScene(getScene('stack-1000'), 7, 120, [], 60);
    await page.goto('/replay.html');
    await page.waitForFunction(() => window.__psReplay !== undefined);
    await page.evaluate(() => window.__psReplay?.ready);
    const browser: ReplayResult = await page.evaluate(
      () => (window.__psReplay as ReplayHarness).runScene('stack-1000', 7, 120, 60),
    );
    recordEngine(info.project.name + ':stack-1000', { nodeHash: node.result.finalHash, browserHash: browser.finalHash });
    expect(browser.finalHash, `stack-1000 in ${info.project.name}`).toBe(node.result.finalHash);
    expect(firstDivergence(node.result.hashes, browser.hashes)).toBeNull();
    expectCleanConsole(c);
  });
});
