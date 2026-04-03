/**
 * Global test setup for Angular 21 Zoneless + Vitest
 * Reference: https://angular.dev/guide/testing
 */

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach, afterEach, vi } from 'vitest';

// Only initialize TestBed if no platform exists yet
// (setupFiles runs before each test file, so we must guard against re-initialization)
if (!TestBed.platform) {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    { teardown: { destroyAfterEach: true } }
  );
  console.log('✓ Test setup loaded for Angular 21 Zoneless testing');
}

console.log('✓ Test setup loaded for Angular 21 Zoneless testing');

// Global fake timers to prevent RxJS timer pollution between tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
});
