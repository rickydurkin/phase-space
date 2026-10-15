import { defineConfig, devices } from '@playwright/test';

// WebGPU in CI (Linux) through SwiftShader in the Chromium headless shell
// (MASTER 13.3, verified on Linux in the research snapshot). On macOS every
// SwiftShader configuration loses the WebGPU device at the first canvas
// present (measured 15/10/2026, ADR 0009), so macOS runs full Chromium in new
// headless mode on the real GPU. PS_SWIFTSHADER=1 forces SwiftShader and
// PS_REAL_GPU=1 forces the real GPU on any platform.
const SWIFTSHADER = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--use-angle=vulkan',
  '--use-vulkan=swiftshader',
  '--use-webgpu-adapter=swiftshader',
  '--ignore-gpu-blocklist',
];
const REAL_GPU = ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'];
const useRealGpu =
  process.env['PS_REAL_GPU'] === '1' ||
  (process.env['PS_SWIFTSHADER'] !== '1' && process.platform === 'darwin');
const chromiumArgs = useRealGpu ? REAL_GPU : SWIFTSHADER;
// The headless shell has no GPU process; the real GPU needs full Chromium (new headless).
const chromiumChannel = useRealGpu ? 'chromium' : undefined;

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
    baseURL: 'http://localhost:4181',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npm run build:test && npm run preview',
    url: 'http://localhost:4181/replay.html',
    timeout: 300_000,
    // Always build and serve our own bundle: another project on the same machine may be
    // listening on a nearby port, and evidence must come from this checkout.
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumChannel === undefined ? {} : { channel: chromiumChannel }),
        launchOptions: { args: chromiumArgs },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /golden\.spec\.ts/,
    },
    // Playwright's Firefox build does not start on macOS 27 (ADR 0009); the SpiderMonkey
    // check runs in CI and in the nightly macOS and Windows runners. PS_FIREFOX=1 forces it.
    ...(process.platform !== 'darwin' || process.env['PS_FIREFOX'] === '1' || (process.env['CI'] ?? '') !== ''
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /golden\.spec\.ts/,
          },
        ]
      : []),
  ],
});
