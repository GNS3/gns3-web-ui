import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(__dirname, './src/tsconfig.spec.json'),
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage'],
    root: resolve(__dirname),
    alias: {
      '@components': resolve(__dirname, './src/app/components'),
      '@services': resolve(__dirname, './src/app/services'),
      '@resolvers': resolve(__dirname, './src/app/resolvers'),
      '@filters': resolve(__dirname, './src/app/filters'),
      '@models': resolve(__dirname, './src/app/models'),
      '@utils': resolve(__dirname, './src/app/utils'),
      'environments/environment': resolve(__dirname, './src/environments/environment.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/test.ts',
        'src/polyfills.ts',
        'src/environments/**',
      ],
    },
    testTimeout: 10000,
    setupFiles: ['./src/setup-vitest.js'],
  },
});

