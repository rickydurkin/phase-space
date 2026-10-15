// Writes tests/golden/<scene>.golden.json. Golden files count as tests
// (MASTER 2.6): rewrite one only with a physicsVersion bump and an entry in
// docs/PHYSICS-CHANGELOG.md. Usage: node tools/golden.ts --write [sceneId]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { getScene, runScene, makeReplay, PHYSICS_VERSION } from '../src/sim/index.ts';

const args = process.argv.slice(2);
const write = args.includes('--write');
const sceneId = args.find((a) => !a.startsWith('--')) ?? 'cube-drop';
const ticks = 1200;
const hashEvery = 60;
const seed = 1;
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const scene = getScene(sceneId);
const { sim, result } = await runScene(scene, seed, ticks, [], hashEvery);
const replay = makeReplay(sim, pkg.version, ticks, hashEvery, result.hashes);
const path = new URL(`../tests/golden/${sceneId}.golden.json`, import.meta.url);
console.log(`${sceneId}: ${ticks} ticks, physics ${PHYSICS_VERSION}, final hash ${result.finalHash}`);
if (!write) {
  console.log('dry run; pass --write to write the golden file');
  process.exit(0);
}
if (existsSync(path)) {
  const old = JSON.parse(readFileSync(path, 'utf8')) as { physicsVersion: string; hashes: { hash: string }[] };
  const oldFinal = old.hashes[old.hashes.length - 1]?.hash;
  if (oldFinal !== result.finalHash && old.physicsVersion === PHYSICS_VERSION) {
    console.error(`ERROR: golden hash changed (${oldFinal} -> ${result.finalHash}) without a physicsVersion bump. Bump PHYSICS_VERSION and record the change in docs/PHYSICS-CHANGELOG.md first.`);
    process.exit(2);
  }
}
writeFileSync(path, JSON.stringify(replay, null, 2) + '\n');
console.log(`wrote ${path.pathname}`);
