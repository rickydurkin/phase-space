// Bundle size budget (MASTER 13.4). Rapier's inlined WebAssembly is about 2.5 MB
// of base64 before compression, so the budget is per category.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const dir = process.argv[2] ?? 'dist';
const budgets = { totalGzipMB: 2.5, largestChunkGzipMB: 1.6 };
let total = 0;
let largest = { file: '', bytes: 0 };
function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html|wasm)$/.test(e)) {
      const gz = gzipSync(readFileSync(p)).length;
      total += gz;
      if (gz > largest.bytes) largest = { file: p, bytes: gz };
    }
  }
}
walk(dir);
const mb = (b) => (b / 1048576).toFixed(2);
console.log(`bundle gzip total ${mb(total)} MB (budget ${budgets.totalGzipMB}), largest ${largest.file} ${mb(largest.bytes)} MB (budget ${budgets.largestChunkGzipMB})`);
if (total > budgets.totalGzipMB * 1048576 || largest.bytes > budgets.largestChunkGzipMB * 1048576) {
  console.error('ERROR size-check: bundle over budget');
  process.exit(1);
}
