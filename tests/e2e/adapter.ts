// Which GPU adapter the Chromium project runs on, shared by playwright.config.ts and the
// console checks in helpers.ts so both make the same decision.
//
// macOS uses the real GPU (SwiftShader loses the WebGPU device at first present there,
// ADR 0009); everywhere else, CI included, uses SwiftShader. PS_SWIFTSHADER=1 forces
// SwiftShader and PS_REAL_GPU=1 forces the real GPU on any platform.
export function usesRealGpu(): boolean {
  return process.env['PS_REAL_GPU'] === '1' || (process.env['PS_SWIFTSHADER'] !== '1' && process.platform === 'darwin');
}

/** True on a CI runner (GitHub Actions sets CI=true). */
export function onCi(): boolean {
  return (process.env['CI'] ?? '') !== '';
}
