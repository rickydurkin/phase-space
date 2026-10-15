import { it, expect } from 'vitest';
import { measure } from '../../helpers/dmath-ref.ts';

// P00 gate: every dmath function within 2 ulp of a 40-digit reference over a million samples.
const SAMPLES = Number(process.env['DMATH_SAMPLES'] ?? 1_000_000);

it('dmath.log10: at most 2 ulp over a million samples', () => {
  const r = measure('log10', SAMPLES, 0xd3a7);
  console.log(`dmath.log10 samples=${r.samples} maxUlp=${r.maxUlp.toFixed(3)} worst=${JSON.stringify(r.worstInput)} over2=${r.over2}`);
  expect(r.over2, `worst ${r.maxUlp} ulp at ${JSON.stringify(r.worstInput)}`).toBe(0);
});
