// Golden replay in the real browsers on this Mac (P00 gate item 2: "in Chrome and Safari on
// Ricky's Mac"). Builds the test bundle, serves it on localhost, opens replay.html?auto=golden
// in each installed browser with `open -a`, and collects the result each page posts back.
// Writes reports/engines-native.json. Opens one tab per browser; nothing leaves this machine.
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env['ENGINE_CHECK_PORT'] ?? 4183);
const ROOT = 'dist-test';
const TIMEOUT_MS = 180_000;
const BROWSERS: Array<{ key: string; app: string }> = [
  { key: 'chrome', app: 'Google Chrome' },
  { key: 'safari', app: 'Safari' },
  { key: 'firefox', app: 'Firefox' },
];
const only = process.argv.slice(2);

if (process.platform !== 'darwin') {
  console.error('engine-check opens the Mac\'s own browsers; run it on macOS');
  process.exit(2);
}
const build = spawnSync('node', ['tools/build-test.js'], { stdio: 'inherit' });
if ((build.status ?? 1) !== 0) process.exit(1);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
};
const golden = readFileSync('tests/golden/cube-drop.golden.json');
const waiting = new Map<string, (body: Record<string, unknown>) => void>();

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (req.method === 'POST' && url.pathname === '/__engine-result') {
    let body = '';
    req.on('data', (c: Buffer) => (body += c.toString()));
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as Record<string, unknown>;
        waiting.get(String(data['nonce']))?.(data);
      } catch {
        // ignore malformed posts
      }
      res.writeHead(204).end();
    });
    return;
  }
  if (url.pathname === '/__golden.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(golden);
    return;
  }
  const rel = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
  const path = join(ROOT, rel);
  if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(path));
});
await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`serving ${ROOT} on http://localhost:${PORT}`);

const results: Record<string, unknown> = existsSync('reports/engines-native.json')
  ? (JSON.parse(readFileSync('reports/engines-native.json', 'utf8')) as Record<string, unknown>)
  : {};
const expectedFinal = (JSON.parse(golden.toString()) as { hashes: Array<{ hash: string }> }).hashes.at(-1)?.hash;
for (const b of BROWSERS) {
  if (only.length > 0 && !only.includes(b.key)) continue;
  if (!existsSync(`/Applications/${b.app}.app`)) {
    console.log(`${b.key}: not installed`);
    continue;
  }
  const nonce = randomUUID();
  const got = new Promise<Record<string, unknown> | null>((resolve) => {
    waiting.set(nonce, resolve);
    setTimeout(() => resolve(null), TIMEOUT_MS);
  });
  const url = `http://localhost:${PORT}/replay.html?auto=golden&nonce=${nonce}`;
  spawnSync('open', ['-a', b.app, url]);
  console.log(`${b.key}: opened ${url}`);
  const data = await got;
  waiting.delete(nonce);
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  results[b.key] =
    data === null
      ? { matches: false, error: `no result within ${TIMEOUT_MS / 1000} s`, date }
      : { ...data, nonce: undefined, expectedFinal, date };
  console.log(`${b.key}: ${data === null ? 'no result' : data['matches'] === true ? `matches ${String(data['finalHash'])}` : `DIFFERS ${JSON.stringify(data)}`}`);
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/engines-native.json', JSON.stringify(results, null, 2) + '\n');
console.log('wrote reports/engines-native.json');
server.close();
process.exit(Object.values(results).every((r) => (r as { matches?: boolean }).matches === true) ? 0 : 1);
