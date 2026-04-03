import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 禁用文件间的并行运行（改为串行）
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    maxConcurrency: 1,
  },
});
