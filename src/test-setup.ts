/**
 * Global test setup for Angular 21 Zoneless + Vitest
 * Reference: https://angular.dev/guide/testing
 */

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach, afterEach, vi } from 'vitest';

// Initialize test environment (only runs once, using if to prevent duplicate initialization)
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
  // Run timers only when fake timers are active
  // Some test files (like validators) manage fake timers themselves
  vi.useRealTimers();

  // Clear all mocks to prevent mock call accumulation
  vi.clearAllMocks();

  // Clean DOM to prevent DOM element accumulation
  document.body.innerHTML = '';
});
