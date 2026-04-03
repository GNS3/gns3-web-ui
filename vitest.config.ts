import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 使用 forks 而不是 threads 来隔离每个测试文件
    // forks 为每个测试文件创建独立的子进程，避免单例服务污染
    pool: 'forks',
    // 禁用文件间的并行运行（改为串行）
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    maxConcurrency: 1,
  },
});
