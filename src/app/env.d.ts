// Build-time globals and environment variables for the browser app.

/** Game version from package.json, injected by vite.config.ts `define`. */
declare const __GAME_VERSION__: string;

interface ImportMetaEnv {
  /** "1" in test builds only; gates window.__ps (MASTER 13.2). */
  readonly VITE_TEST_API?: string;
}
