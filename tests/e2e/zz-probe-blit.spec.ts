// TEMPORARY diagnostic for D-015 (blit feedback loop on the WebGL2 fallback, CI run 40037733859).
// Runs only on the wip/blit-probe branch; never merged.
//
// Run 40038923665 showed the warning in 7 of 12 probes while no JS blitFramebuffer call had
// equal read and draw bindings, so the failing blit is probably Chrome's own. This round finds
// which action triggers it: readPixels only, orbit drags only, both, or neither (idle).
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { bootGame, readRegion, canvasSize } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

type Variant = 'read' | 'drag' | 'both' | 'idle' | 'webgl-boot-both';

async function toWebGL2(page: Page, variant: Variant): Promise<void> {
  if (variant === 'webgl-boot-both') {
    await bootGame(page, '?webgl=1');
  } else {
    await bootGame(page);
    test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs WebGPU to lose');
  }
  await page.evaluate(() => (window.__ps as TestApi).pause());
  await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
  await page.evaluate(() => (window.__ps as TestApi).step(20));
  if (variant !== 'webgl-boot-both') await page.evaluate(() => (window.__ps as TestApi).crashGpu({ failRecoveries: 3 }));
  for (let i = 0; ; i++) {
    const ok = await readRegion(page, 0, 0, 1, 1).then(() => true, () => false);
    const backend = await page.evaluate(() => (window.__ps as TestApi).backend());
    if (ok && backend === 'WebGL2') break;
    if (i > 60) throw new Error(`no WebGL2 (backend ${backend})`);
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => (window.__ps as TestApi).step(300));
}

for (const variant of ['read', 'drag', 'both', 'idle', 'webgl-boot-both'] as const) {
  for (let n = 0; n < 4; n++) {
    test(`probe ${variant} ${n}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium only');
      let phase = 'boot';
      const hits: string[] = [];
      page.on('console', (m) => {
        if (/feedback|INVALID/i.test(m.text())) hits.push(phase);
      });
      await toWebGL2(page, variant);
      phase = 'settled';
      await page.waitForTimeout(1500);
      const { w, h } = await canvasSize(page);
      for (let round = 0; round < 4; round++) {
        if (variant === 'read' || variant === 'both' || variant === 'webgl-boot-both') {
          phase = `read${round}`;
          for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.4], [0.7, 0.4], [0.35, 0.7], [0.65, 0.7]] as const) {
            await readRegion(page, Math.floor(w * fx) - 4, Math.floor(h * fy) - 4, 8, 8);
          }
        }
        if (variant === 'drag' || variant === 'both' || variant === 'webgl-boot-both') {
          phase = `drag${round}`;
          const box = await page.locator('canvas').first().boundingBox();
          if (box === null) throw new Error('no canvas');
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 12 });
          await page.mouse.up();
        }
        phase = `wait${round}`;
        await page.waitForTimeout(1500);
      }
      phase = 'end';
      await page.waitForTimeout(1000);
      console.log(`PROBE-RESULT ${variant} ${n}: ${hits.length} hits [${hits.join(', ')}]`);
    });
  }
}
