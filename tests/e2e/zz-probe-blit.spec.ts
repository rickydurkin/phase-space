// TEMPORARY diagnostic for D-015 (blit feedback loop on the WebGL2 fallback, CI run 40037733859).
// Runs only on the wip/blit-probe branch; never merged.
import { test } from '@playwright/test';
import { bootGame, readRegion, canvasSize } from './helpers.ts';
import type { TestApi } from '../../src/app/test-api.ts';

for (let n = 0; n < 12; n++) {
  test(`probe ${n}: blit with read == draw on the WebGL2 fallback`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium only');
    const hits: string[] = [];
    page.on('console', (m) => {
      const t = m.text();
      if (/PROBE|feedback|INVALID/i.test(t)) hits.push(t);
    });
    await page.addInitScript(() => {
      const proto = WebGL2RenderingContext.prototype;
      const ids = new WeakMap<object, number>();
      let next = 1;
      const id = (fb: unknown): string => (fb === null ? 'default' : `fb${ids.get(fb as object) ?? '?'}`);
      const log: string[] = [];
      const caller = (): string => (new Error().stack ?? '').split('\n').slice(2, 5).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '')).join(' < ');
      const push = (s: string): void => {
        log.push(s);
        if (log.length > 16) log.shift();
      };
      const create = proto.createFramebuffer;
      proto.createFramebuffer = function () {
        const fb = create.call(this);
        if (fb !== null) ids.set(fb, next++);
        push(`create ${id(fb)}`);
        return fb;
      };
      const del = proto.deleteFramebuffer;
      proto.deleteFramebuffer = function (fb: WebGLFramebuffer | null) {
        push(`delete ${id(fb)}`);
        return del.call(this, fb);
      };
      const bind = proto.bindFramebuffer;
      const names = (gl: WebGL2RenderingContext, t: number): string => (t === gl.FRAMEBUFFER ? 'FB' : t === gl.READ_FRAMEBUFFER ? 'READ' : t === gl.DRAW_FRAMEBUFFER ? 'DRAW' : String(t));
      proto.bindFramebuffer = function (target: number, fb: WebGLFramebuffer | null) {
        push(`bind ${names(this, target)} ${id(fb)} <- ${caller()}`);
        return bind.call(this, target, fb);
      };
      const blit = proto.blitFramebuffer;
      proto.blitFramebuffer = function (...args: Parameters<typeof blit>) {
        const read = this.getParameter(this.READ_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
        const draw = this.getParameter(this.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
        if (read === draw) console.log(`PROBE blit read==draw ${id(read)} at ${caller()}\n  ${log.join('\n  ')}`);
        push(`blit READ ${id(read)} DRAW ${id(draw)}`);
        return blit.apply(this, args);
      };
    });
    await bootGame(page);
    test.skip((await page.evaluate(() => (window.__ps as TestApi).backend())) !== 'WebGPU', 'needs WebGPU to lose');
    await page.evaluate(() => (window.__ps as TestApi).pause());
    await page.evaluate(() => (window.__ps as TestApi).loadScene('cube-drop', 1));
    await page.evaluate(() => (window.__ps as TestApi).step(20));
    await page.evaluate(() => (window.__ps as TestApi).crashGpu({ failRecoveries: 3 }));
    for (let i = 0; ; i++) {
      const ok = await readRegion(page, 0, 0, 1, 1).then(() => true, () => false);
      const backend = await page.evaluate(() => (window.__ps as TestApi).backend());
      if (ok && backend === 'WebGL2') break;
      if (i > 60) throw new Error('no WebGL2 recovery');
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => (window.__ps as TestApi).step(300));
    const { w, h } = await canvasSize(page);
    for (let round = 0; round < 4; round++) {
      for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.4], [0.7, 0.4], [0.35, 0.7], [0.65, 0.7]] as const) {
        await readRegion(page, Math.floor(w * fx) - 4, Math.floor(h * fy) - 4, 8, 8);
      }
      const box = await page.locator('canvas').first().boundingBox();
      if (box === null) throw new Error('no canvas');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(800);
    }
    console.log(`PROBE-RESULT ${n}: ${hits.length} hits`);
    for (const hit of hits.slice(0, 2)) console.log(hit);
  });
}
