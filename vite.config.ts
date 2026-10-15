// Vite configuration for the PHASE SPACE browser app (MASTER 10, 13.2).
//
// Two pages: index.html (the game, AS in a Web Worker, WebGPU renderer) and
// replay.html (headless replay harness used by Playwright to compare hashes
// across engines). The Rapier compat package inlines its WebAssembly as
// base64, so no wasm plugin is needed; its chunk is large, hence the raised
// chunk size warning limit.
//
// Environment:
//   PS_OUT_DIR       output directory (default "dist"; tests use "dist-test")
//   VITE_TEST_API=1  include window.__ps (never in production builds)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = (rel: string): string => fileURLToPath(new URL(rel, import.meta.url));

const pkg = JSON.parse(readFileSync(here('./package.json'), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  define: {
    __GAME_VERSION__: JSON.stringify(pkg.version),
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    outDir: process.env['PS_OUT_DIR'] ?? 'dist',
    emptyOutDir: true,
    // The Rapier compat chunk (base64 wasm inlined) is about 4.4 MB minified.
    chunkSizeWarningLimit: 4800,
    rolldownOptions: {
      input: {
        main: here('./index.html'),
        replay: here('./replay.html'),
      },
    },
  },
  preview: {
    port: 4181,
    strictPort: true,
  },
});
