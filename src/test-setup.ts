/**
 * Global test setup for Angular 21 Zoneless + Vitest
 * Reference: https://angular.dev/guide/testing
 */

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach, afterEach, vi } from 'vitest';

// 初始化测试环境（只执行一次，使用 if 防止重复初始化）
if (!TestBed.platform) {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    { teardown: { destroyAfterEach: true } }
  );
}

// Global fake timers to prevent RxJS timer pollution between tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // 只在 fake timers 激活时才运行 timers
  // 某些测试文件（如 validators）自己管理 fake timers
  vi.useRealTimers();

  // 清理所有 mock，防止 mock 调用累积
  vi.clearAllMocks();

  // 清理 DOM，防止 DOM 元素累积
  document.body.innerHTML = '';
});
