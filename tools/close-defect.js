// Close a defect row in docs/DEFECTS.md: node tools/close-defect.js D-002 "fix summary" "regression test and evidence"
import { readFileSync, writeFileSync } from 'node:fs';

const [id, fix, test] = process.argv.slice(2);
if (!id || !fix || !test) {
  console.error('usage: node tools/close-defect.js D-NNN "fix" "regression test and evidence"');
  process.exit(2);
}
const d = new Date();
const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const path = 'docs/DEFECTS.md';
const lines = readFileSync(path, 'utf8').split('\n');
const i = lines.findIndex((l) => l.startsWith(`| ${id} |`));
if (i < 0) {
  console.error(`ERROR ${id} not found in ${path}`);
  process.exit(1);
}
const cells = (lines[i] ?? '').split(' | ');
// cells: ["| D-002", date, status, summary, "regression |"]
if (cells.length < 5) {
  console.error(`ERROR unexpected row format for ${id}`);
  process.exit(1);
}
cells[2] = `closed ${date}`;
cells[3] = `${cells[3]} Fix: ${fix}`;
cells[cells.length - 1] = `${test} |`;
lines[i] = cells.join(' | ');
writeFileSync(path, lines.join('\n'));
console.log(`${id} closed`);
