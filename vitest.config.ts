import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
  test: {
    // Look for *.test.ts and *.test.tsx files anywhere under src/ and tests/
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],

    // Default to node environment for pure-function tests.
    // We'll override to 'jsdom' per-file when we add React component tests later.
    environment: 'node',

    // Cleaner output for small test suites.
    reporters: 'default',

    // Type-check tests as we run them. Catches typos and import errors
    // that ts-node-style transpilation would otherwise let through.
    typecheck: {
      enabled: false, // Off for speed; flip to true for CI later.
    },
  },
});
