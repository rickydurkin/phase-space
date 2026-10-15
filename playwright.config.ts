import { defineConfig, devices } from '@playwright/test';

// WebGPU in CI through SwiftShader (MASTER 13.3). On Ricky's Mac set
// PS_REAL_GPU=1 to use the real GPU instead (perf:mac does this).
const SWIFTSHADER = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-angle=vulkan',
  '--use-vulkan=swiftshader',
  '--use-webgpu-adapter=swiftshader',
  '--ignore-gpu-blocklist',
];
const REAL_GPU = ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'];
const chromiumArgs = process.env['PS_REAL_GPU'] === '1' ? REAL_GPU : SWIFTSHADER;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/playwright.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npm run build:test && npm run preview',
    url: 'http://localhost:4173/replay.html',
    timeout: 300_000,
    reuseExistingServer: process.env['CI'] === undefined,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { args: chromiumArgs } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /golden\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /golden\.spec\.ts/,
    },
  ],
});
