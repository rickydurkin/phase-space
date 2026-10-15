import { defineConfig } from 'vitest/config';

// Projects map to the commands in MASTER 13.1. Run one with `vitest run --project <name>`.
export default defineConfig({
  test: {
    reporters: process.env['CI'] ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'reports/vitest-junit.xml' },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'validation',
          include: ['tests/validation/**/*.test.ts'],
          exclude: ['tests/validation/dmath-full/**'],
          testTimeout: 300_000,
        },
      },
      {
        test: {
          name: 'dmath-full',
          include: ['tests/validation/dmath-full/**/*.test.ts'],
          testTimeout: 3_600_000,
        },
      },
      {
        test: {
          name: 'golden',
          include: ['tests/golden/**/*.test.ts'],
          testTimeout: 600_000,
        },
      },
      {
        test: {
          name: 'fuzz',
          include: ['tests/fuzz/**/*.test.ts'],
          testTimeout: 1_800_000,
        },
      },
    ],
  },
});
