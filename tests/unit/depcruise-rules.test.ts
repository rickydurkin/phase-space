import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { cruise } from 'dependency-cruiser';

// Proves the module-boundary rules in .dependency-cruiser.cjs fire (gate review note to D-004),
// by cruising a small throwaway tree that breaks each rule, plus a clean positive control.
const require = createRequire(import.meta.url);
const config = require('../../.dependency-cruiser.cjs') as { forbidden: unknown[] };

let dir = '';

function write(rel: string, text: string): void {
  const p = join(dir, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, text);
}

async function violations(files: string[]): Promise<string[]> {
  const result = await cruise(
    files,
    {
      validate: true,
      ruleSet: { forbidden: config.forbidden } as never,
      baseDir: dir,
      tsPreCompilationDeps: true,
      doNotFollow: { path: 'node_modules' },
    },
    { extensions: ['.ts', '.js'] },
  );
  const output = result.output as { summary: { violations: Array<{ rule: { name: string } }> } };
  return output.summary.violations.map((v) => v.rule.name);
}

beforeAll(() => {
  // realpath: on macOS the temporary folder is a symlink (/var to /private/var), which would
  // make resolved paths relative to the wrong root and hide every violation.
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'ps-depcruise-')));
  write('src/render/view.ts', 'export const view = 1;\n');
  write('src/gpu/kernel.ts', 'export const kernel = 1;\n');
  write('src/sim/ok/dmath.ts', 'export const sin = (x: number): number => x;\n');
  write('src/sim/ok/user.ts', "import { sin } from './dmath.ts';\nexport const y = sin(1);\n");
  write('src/sim/bad/render.ts', "import { view } from '../../render/view.ts';\nexport const v = view;\n");
  write('src/sim/bad/gpu.ts', "import { kernel } from '../../gpu/kernel.ts';\nexport const k = kernel;\n");
  write('src/sim/bad/builtin.ts', "import { readFileSync } from 'node:fs';\nexport const r = readFileSync;\n");
  write('src/app/a.ts', "import { b } from './b.ts';\nexport const a = (): number => b() + 1;\n");
  write('src/app/b.ts', "import { a } from './a.ts';\nexport const b = (): number => a() - 1;\n");
});

afterAll(() => {
  if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

describe('dependency-cruiser boundary rules', () => {
  it('positive control: a sim module importing a sibling has no violations', async () => {
    expect(await violations(['src/sim/ok'])).toEqual([]);
  });
  it('src/sim may not import rendering code', async () => {
    expect(await violations(['src/sim/bad/render.ts'])).toContain('sim-no-presentation');
  });
  it('src/sim may not import GPU code', async () => {
    expect(await violations(['src/sim/bad/gpu.ts'])).toContain('sim-no-presentation');
  });
  it('src/sim may not import Node built-ins', async () => {
    expect(await violations(['src/sim/bad/builtin.ts'])).toContain('sim-no-node-builtins');
  });
  it('circular imports are rejected', async () => {
    expect(await violations(['src/app'])).toContain('no-circular');
  });
});
