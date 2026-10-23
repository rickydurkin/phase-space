import { expect, type Page, type ConsoleMessage } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { TestApi } from '../../src/app/test-api.ts';

declare global {
  interface Window {
    __ps?: TestApi;
  }
}

const allowlist = JSON.parse(readFileSync(new URL('../console-allowlist.json', import.meta.url), 'utf8')) as {
  warnings: { pattern: string; reason: string }[];
};

/** Collect console errors and non-allowlisted warnings for the whole page life. */
export function watchConsole(page: Page): { errors: string[]; warnings: string[]; pageErrors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && !allowlist.warnings.some((w) => new RegExp(w.pattern).test(m.text()))) {
      warnings.push(m.text());
    }
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return { errors, warnings, pageErrors };
}

export function expectCleanConsole(
  c: { errors: string[]; warnings: string[]; pageErrors: string[] },
  ignoreWarnings: RegExp[] = [],
  ignorePageErrors: RegExp[] = [],
): void {
  const pageErrors = c.pageErrors.filter((e) => !ignorePageErrors.some((re) => re.test(e)));
  expect(pageErrors, 'uncaught exceptions').toEqual([]);
  expect(c.errors, 'console errors').toEqual([]);
  const warnings = c.warnings.filter((w) => !ignoreWarnings.some((re) => re.test(w)));
  expect(warnings, 'console warnings outside the allowlist').toEqual([]);
}

/** Open the game and wait until the test API reports boot complete. Returns the boot time in ms. */
export async function bootGame(page: Page, query = ''): Promise<number> {
  const t0 = Date.now();
  await page.goto(`/${query}`);
  await page.waitForFunction(() => window.__ps !== undefined, null, { timeout: 60_000 });
  await page.evaluate(() => window.__ps?.ready);
  return Date.now() - t0;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Mean colour of a readPixels region (tight RGBA rows, top row first). */
export function meanColour(rgba: Uint8Array | number[], w: number, h: number): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    r += rgba[i * 4] as number;
    g += rgba[i * 4 + 1] as number;
    b += rgba[i * 4 + 2] as number;
  }
  return { r: r / n, g: g / n, b: b / n };
}

/** Read a region through the test API (returned as a plain array across the Playwright boundary). */
export async function readRegion(page: Page, x: number, y: number, w: number, h: number): Promise<number[]> {
  return page.evaluate(
    async ([x, y, w, h]) => Array.from(await (window.__ps as TestApi).readPixels(x, y, w, h)),
    [x, y, w, h] as const,
  );
}

/** The wooden cube is warm: red well above blue. Floor and sky are neutral or cool. */
export function looksLikeCube(c: Rgb): boolean {
  return c.r > 70 && c.r > c.g + 20 && c.r > c.b + 50;
}

export async function canvasSize(page: Page): Promise<{ w: number; h: number }> {
  return page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (c === null) throw new Error('no canvas');
    return { w: c.width, h: c.height };
  });
}

/** Scan a column of sample squares down the middle of the canvas until one looks like the cube. */
export async function findCube(page: Page): Promise<{ found: boolean; at: number; colour: Rgb }> {
  const { w, h } = await canvasSize(page);
  const size = 8;
  const x = Math.floor(w / 2 - size / 2);
  const top = Math.floor(h * 0.1);
  const squares = Math.ceil((h * 0.9 - top) / size);
  // One read for the whole column. Every readPixels renders the scene again, which took 1.4 s on
  // SwiftShader after device-loss recovery (CI run 3), so square-by-square reads ran out of time.
  const px = await readRegion(page, x, top, size, squares * size);
  const bytes = size * size * 4;
  let best: Rgb = { r: 0, g: 0, b: 0 };
  for (let i = 0; i < squares; i++) {
    const c = meanColour(px.slice(i * bytes, (i + 1) * bytes), size, size);
    if (looksLikeCube(c)) return { found: true, at: top + i * size, colour: c };
    if (c.r > best.r) best = c;
  }
  return { found: false, at: -1, colour: best };
}
