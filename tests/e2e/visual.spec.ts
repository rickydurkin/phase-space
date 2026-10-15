import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { bootGame, watchConsole, expectCleanConsole, readRegion, meanColour, canvasSize } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

// Reference-scene pixel readback first, screenshot second (MASTER 13.3), with
// per-adapter baselines in tests/visual/baselines/. A missing baseline is
// written on first run and must be committed.
const TOLERANCE = 12; // per channel, 0 to 255

interface Baseline {
  backend: string;
  regions: { name: string; mean: { r: number; g: number; b: number } }[];
}

for (const variant of ['webgpu', 'webgl']) {
  test(`cube-drop at tick 120 matches the ${variant} baseline`, async ({ page }, info) => {
    const c = watchConsole(page);
    await bootGame(page, variant === 'webgl' ? '?webgl=1' : '');
    const backend = await page.evaluate(() => (window.__ps as TestApi).backend());
    await page.evaluate(() => (window.__ps as TestApi).pause());
    await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
    await page.evaluate(() => (window.__ps as TestApi).step(120));
    const { w, h } = await canvasSize(page);
    const size = 16;
    const samples = [
      { name: 'centre', x: w / 2, y: h / 2 },
      { name: 'upper', x: w / 2, y: h * 0.2 },
      { name: 'floor-left', x: w * 0.25, y: h * 0.8 },
      { name: 'floor-right', x: w * 0.75, y: h * 0.8 },
      { name: 'sky', x: w * 0.5, y: h * 0.05 },
    ];
    const regions = [];
    for (const s of samples) {
      const px = await readRegion(page, Math.floor(s.x - size / 2), Math.floor(s.y - size / 2), size, size);
      regions.push({ name: s.name, mean: meanColour(px, size, size) });
    }
    mkdirSync('reports/visual', { recursive: true });
    await page.screenshot({ path: `reports/visual/cube-drop-120-${info.project.name}-${variant}.png` });
    const adapter = `${process.platform}-${process.env['PS_SWIFTSHADER'] === '1' || (process.platform !== 'darwin' && process.env['PS_REAL_GPU'] !== '1') ? 'swiftshader' : 'gpu'}`;
    const baselinePath = `tests/visual/baselines/cube-drop-120-${info.project.name}-${variant}-${adapter}.json`;
    const current: Baseline = { backend, regions };
    if (!existsSync(baselinePath)) {
      mkdirSync('tests/visual/baselines', { recursive: true });
      writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n');
      console.log(`wrote new visual baseline ${baselinePath}`);
    } else {
      const base = JSON.parse(readFileSync(baselinePath, 'utf8')) as Baseline;
      for (const r of regions) {
        const b = base.regions.find((x) => x.name === r.name);
        expect(b, `baseline region ${r.name}`).toBeDefined();
        for (const ch of ['r', 'g', 'b'] as const) {
          expect(Math.abs(r.mean[ch] - (b as Baseline['regions'][number]).mean[ch]), `${r.name}.${ch}`).toBeLessThanOrEqual(TOLERANCE);
        }
      }
    }
    // The sky sample must differ from the floor samples: the scene has depth.
    const sky = regions.find((r) => r.name === 'sky')?.mean;
    const floor = regions.find((r) => r.name === 'floor-left')?.mean;
    expect(Math.abs((sky?.r ?? 0) - (floor?.r ?? 0)) + Math.abs((sky?.g ?? 0) - (floor?.g ?? 0))).toBeGreaterThan(10);
    expectCleanConsole(c);
  });
}
