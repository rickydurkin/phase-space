import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

// Proves each determinism lint rule fires (P00 gate). Snippets are linted as if
// they lived in src/sim.
const root = fileURLToPath(new URL('../../', import.meta.url));
const eslint = new ESLint({ cwd: root });

async function rulesFor(code: string, file = 'src/sim/__probe__.ts'): Promise<string[]> {
  const [res] = await eslint.lintText(code, { filePath: `${root}${file}` });
  return (res?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

describe('src/sim determinism lint rules', () => {
  it('blocks Math.random', async () => {
    expect(await rulesFor('export const r = Math.random();')).toContain('sim/no-nondeterministic-math');
  });
  it('blocks Date.now and new Date', async () => {
    expect(await rulesFor('export const t = Date.now();')).toContain('sim/no-wall-clock');
    expect(await rulesFor('export const d = new Date();')).toContain('sim/no-wall-clock');
  });
  it('blocks performance.now', async () => {
    expect(await rulesFor('export const p = performance.now();')).toContain('sim/no-wall-clock');
  });
  it('blocks Math.sin and Math.tanh', async () => {
    expect(await rulesFor('export const s = Math.sin(1);')).toContain('sim/no-nondeterministic-math');
    expect(await rulesFor('export const s = Math.tanh(1);')).toContain('sim/no-nondeterministic-math');
    expect(await rulesFor('export const s = Math.pow(2, 3);')).toContain('sim/no-nondeterministic-math');
  });
  it('blocks the ** operator', async () => {
    expect(await rulesFor('export const e = 2 ** 3;')).toContain('sim/no-exponent-operator');
    expect(await rulesFor('let x = 2; x **= 3; export { x };')).toContain('sim/no-exponent-operator');
  });
  it('blocks non-allowlisted imports and dynamic import', async () => {
    expect(await rulesFor("import * as THREE from 'three'; export const t = THREE;")).toContain('sim/import-allowlist');
    expect(await rulesFor("import { z } from 'zod'; export const s = z;")).toContain('sim/import-allowlist');
    expect(await rulesFor("export const m = import('./x.ts');")).toContain('sim/import-allowlist');
  });
  it('blocks DOM and host globals', async () => {
    expect(await rulesFor('export const w = window.innerWidth;')).toContain('sim/no-wall-clock');
    expect(await rulesFor('export const h = setTimeout(() => 0, 1);')).toContain('sim/no-wall-clock');
  });
  // D-004: routes around the rules that the gate review found.
  const bypasses: Array<[string, string]> = [
    ['const { sin } = Math; export const s = sin(1);', 'sim/no-nondeterministic-math'],
    ['const M = Math; export const s = M.sin(1);', 'sim/no-nondeterministic-math'],
    ['export const s = globalThis.Math.sin(1);', 'sim/no-wall-clock'],
    ['export const t = globalThis.Date.now();', 'sim/no-wall-clock'],
    ['export const t = globalThis.performance.now();', 'sim/no-wall-clock'],
    ["export const r = Reflect.get(Math, 'random')();", 'sim/no-wall-clock'],
    ["export const r = Reflect.get(Math, 'random')();", 'sim/no-nondeterministic-math'],
    ['export const p = Math.pow.call(null, 2, 3);', 'sim/no-nondeterministic-math'],
    ['export const r = self.Math.random();', 'sim/no-wall-clock'],
    ["export const f = new Function('return 1');", 'sim/no-wall-clock'],
    ["export const e = eval('1 + 1');", 'sim/no-wall-clock'],
    ['export const w = new WeakRef({});', 'sim/no-wall-clock'],
    ["export const n = new Intl.NumberFormat('en-GB').format(1);", 'sim/no-wall-clock'],
    ['function use(m: unknown): unknown { return m; } export const u = use(Math);', 'sim/no-nondeterministic-math'],
  ];
  for (const [code, rule] of bypasses) {
    it(`D-004: blocks ${code} (${rule})`, async () => {
      expect(await rulesFor(code)).toContain(rule);
    });
  }
  it('D-004 positive control: a local variable that shadows a banned name and an allowed Math member assigned to a constant pass', async () => {
    const r = await rulesFor('const floor = Math.floor; export function f(self: number): number { return floor(self); }');
    expect(r.filter((x) => x.startsWith('sim/'))).toEqual([]);
  });
  it('D-004: a type-only reference to a banned global is allowed (typeof Date is a value query and is blocked)', async () => {
    const r = await rulesFor('export type Callable = Function; export const x = 1;');
    expect(r.filter((x) => x.startsWith('sim/'))).toEqual([]);
  });

  it('positive control: allowlisted maths, constants, relative and Rapier imports pass', async () => {
    const ok = await rulesFor(
      "import RAPIER from '@dimforge/rapier3d-deterministic-compat';\nimport { sin } from './dmath/index.ts';\nexport const v = Math.sqrt(2) * Math.PI + Math.floor(1.5) + Math.fround(1) + sin(1) + (RAPIER ? 1 : 0);",
    );
    expect(ok.filter((r) => r.startsWith('sim/'))).toEqual([]);
  });
  it('the rules do not apply outside src/sim', async () => {
    const r = await rulesFor('export const t = Date.now() + Math.random() + Math.sin(2 ** 3);', 'src/app/__probe__.ts');
    expect(r.filter((x) => x.startsWith('sim/'))).toEqual([]);
  });
});
