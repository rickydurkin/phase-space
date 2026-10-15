// Build with the test API enabled (window.__ps), into dist-test/.
import { spawnSync } from 'node:child_process';
const r = spawnSync('npx', ['vite', 'build', '--outDir', 'dist-test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, VITE_TEST_API: '1' },
});
process.exit(r.status ?? 1);
