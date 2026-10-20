// ESLint flat config. The sim rules come from tools/eslint/plugin-sim.js.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import sim from './tools/eslint/plugin-sim.js';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-test/**',
      'dist-spike-*/**',
      'dist-pane/**',
      'node_modules/**',
      'programme/**',
      'reports/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The Authoritative Simulation: deterministic, no host globals, no DOM.
    files: ['src/sim/**/*.ts'],
    plugins: { sim },
    languageOptions: { globals: {} },
    rules: {
      'sim/no-nondeterministic-math': 'error',
      'sim/no-wall-clock': 'error',
      'sim/no-exponent-operator': 'error',
      'sim/import-allowlist': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['src/app/**/*.ts', 'src/render/**/*.ts', 'src/ui/**/*.ts', 'src/gpu/**/*.ts', 'src/audio/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Browser-side spike pages
    files: ['tools/spikes/*/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['tools/**/*.{ts,js,mjs}', 'tests/**/*.ts', '*.config.{ts,js,mjs}', '.dependency-cruiser.cjs'],
    ignores: ['tools/spikes/*/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
);
