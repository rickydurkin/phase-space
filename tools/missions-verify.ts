// MASTER 7.6 and 13.1: verify missions. P0 wires the pipeline with an empty
// mission set: every content/missions/*.json is validated against the schema
// and listed; the necessity checks (goal not met at setup, references pass,
// traps fail, guessing bot fails) arrive with the mission framework in P2 and
// this tool fails loudly until then if a mission file exists.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { MissionSchema } from '../src/content/schemas/mission.ts';

const args = process.argv.slice(2);
const all = args.includes('--all');
const ids = args.filter((a) => !a.startsWith('--'));
const dir = 'content/missions';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
const selected = ids.length > 0 ? files.filter((f) => ids.some((id) => f.startsWith(id))) : files;
const results: { id: string; schema: boolean; necessity: 'not-implemented' | 'pass' | 'fail'; errors: string[] }[] = [];
let failed = 0;
for (const f of selected) {
  const raw = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as unknown;
  const parsed = MissionSchema.safeParse(raw);
  const id = parsed.success ? parsed.data.id : f;
  const errors = parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  // No mission may count as content before the necessity verifier exists (MASTER 2.11).
  errors.push('necessity checks not implemented yet (P2); a mission file may not be added before then');
  failed++;
  results.push({ id, schema: parsed.success, necessity: 'not-implemented', errors });
  for (const e of errors) console.error(`ERROR mission ${id}: ${e}`);
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/missions.json', JSON.stringify({ date: new Date().toISOString(), all, total: files.length, verified: selected.length - failed, failed, results }, null, 2));
console.log(`missions:verify: ${files.length} mission files, ${selected.length - failed} verified, ${failed} failed${all ? ' (all)' : ''}`);
process.exit(failed > 0 ? 1 : 0);
