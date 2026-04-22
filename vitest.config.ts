import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use forks instead of threads to isolate each test file
    // forks creates independent child processes for each test file to avoid singleton service pollution
    pool: 'forks',
    // Disable parallel execution between files (switch to serial)
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    maxConcurrency: 1,
  },
});
