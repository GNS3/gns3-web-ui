/**
 * Global test setup for Angular 21 Zoneless + Vitest
 * Reference: https://angular.dev/guide/testing
 */

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach, afterEach, vi } from 'vitest';

// setupFilesAfterEnvironment 只在测试环境初始化后运行一次
// 使用 if 判断防止重复初始化
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
  vi.runAllTimers();
  vi.useRealTimers();
  // 重置单例服务，防止状态污染到其他测试
  // 使用 forks 池 + resetTestingModule 确保 Angular 单例服务在每个测试后被清理
  TestBed.resetTestingModule();
});
