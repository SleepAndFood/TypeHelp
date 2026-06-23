import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.{test,spec}.js'],
    exclude: ['test/e2e/**', 'node_modules/**'],
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ['default'],
  },
});
