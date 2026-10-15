// Banned characters and en-GB spelling lint for content and player-facing text
// (MASTER 2.13). Scans content/, docs/, src/ui, src/app, README.md and
// CLAUDE.md; programme/ is Ricky's and is not scanned.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['content', 'docs', 'src/ui', 'src/app', 'src/render', 'README.md', 'CLAUDE.md', 'index.html', 'replay.html'];
const TEXT_EXT = new Set(['.md', '.json', '.html', '.txt', '.ts', '.css', '.yml', '.yaml']);
const ch = (...codes: number[]): string => codes.map((c) => String.fromCharCode(c)).join('');
// Built from code points so this source file itself contains none of the banned characters.
const BANNED: Array<[RegExp, string]> = [
  [new RegExp(ch(0x2014), 'g'), 'em dash (use a hyphen or restructure)'],
  [new RegExp(ch(0x2013), 'g'), 'en dash (use a hyphen or "to")'],
  [new RegExp(ch(0x2015), 'g'), 'horizontal bar'],
  [new RegExp(`[${ch(0x2018, 0x2019)}]`, 'g'), 'curly single quote (use a straight apostrophe)'],
  [new RegExp(`[${ch(0x201c, 0x201d)}]`, 'g'), 'curly double quote (use straight quotes)'],
  [new RegExp(ch(0x2026), 'g'), 'ellipsis character (use three full stops)'],
  [new RegExp(`[${ch(0x200b)}-${ch(0x200d)}${ch(0xfeff)}${ch(0x2060)}]`, 'g'), 'zero-width character'],
  [new RegExp(ch(0xa0), 'g'), 'non-breaking space'],
  [new RegExp(ch(0xad), 'g'), 'soft hyphen'],
  [/\p{Extended_Pictographic}/gu, 'emoji or pictograph'],
];
// US spellings that have an unambiguous en-GB form. Words with legitimate UK
// uses (meter, program, license as a verb, dialog) are left out on purpose.
const US_WORDS = [
  'analyze', 'analyzed', 'analyzing', 'behavior', 'behaviors', 'center', 'centered', 'centers', 'color', 'colors',
  'colored', 'defense', 'favorite', 'gray', 'honor', 'humor', 'labor', 'liter', 'liters', 'optimize', 'optimized',
  'optimizing', 'organize', 'organized', 'organization', 'realize', 'realized', 'recognize', 'recognized', 'aluminum',
  'catalog', 'traveled', 'traveling', 'modeling', 'modeled', 'canceled', 'fiber', 'theater', 'neighbor', 'armor',
  'flavor', 'vapor', 'kilometer', 'kilometers', 'centimeter', 'millimeter', 'minimize', 'maximize', 'summarize',
  'visualize', 'visualization', 'normalize', 'normalized', 'stabilize', 'customize', 'utilize', 'initialize',
  'initialized', 'serialize', 'serialized', 'deserialize',
];
const US_RE = new RegExp(`\\b(${US_WORDS.join('|')})\\b`, 'gi');
const SPELL_EXT = new Set(['.md', '.json', '.html', '.txt']);

function* walk(path: string): Generator<string> {
  const st = statSync(path, { throwIfNoEntry: false });
  if (st === undefined) return;
  if (st.isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    yield* walk(join(path, entry));
  }
}

function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

/** HTML: spell-check visible text only, not CSS, scripts or attributes. */
function stripHtmlCode(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<script[\s\S]*?<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<[^>]*>/g, (m) => m.replace(/[^\n]/g, ' '));
}

let problems = 0;
let files = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (!TEXT_EXT.has(extname(file))) continue;
    files++;
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('lint-allow')) return;
      for (const [re, what] of BANNED) {
        re.lastIndex = 0;
        if (re.test(line)) {
          problems++;
          console.error(`ERROR ${file}:${i + 1}: ${what}`);
        }
      }
    });
    if (SPELL_EXT.has(extname(file))) {
      const prose = extname(file) === '.md' ? stripCode(text) : extname(file) === '.html' ? stripHtmlCode(text) : text;
      prose.split('\n').forEach((line, i) => {
        if (line.includes('lint-allow')) return;
        US_RE.lastIndex = 0;
        const m = US_RE.exec(line);
        if (m !== null) {
          problems++;
          console.error(`ERROR ${file}:${i + 1}: US spelling "${m[1]}" (en-GB required, MASTER 2.13)`);
        }
      });
    }
  }
}
console.log(`content-lint: ${files} files, ${problems} problems`);
process.exit(problems > 0 ? 1 : 0);
