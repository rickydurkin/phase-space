import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: { outDir: fileURLToPath(new URL('../../../dist-spike-s3/', import.meta.url)), emptyOutDir: true },
  logLevel: 'warn',
});
