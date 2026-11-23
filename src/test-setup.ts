/**
 * Global test setup for Angular 21 Zoneless + Vitest
 * Reference: https://angular.dev/guide/testing
 */

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach, afterEach, vi } from 'vitest';

// Initialize test environment (only runs once, using if to prevent duplicate initialization)
if (!TestBed.platform) {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: true },
  });
}

// jsdom's initial viewport, captured before any spec resizes the window.
// ng test runs vitest with isolate:false, so spec files share one jsdom
// window: a spec that sets window.innerWidth/innerHeight for a test must
// not leak the size into co-located files (geometry specs assume the
// default viewport).
const initialViewport = { width: window.innerWidth, height: window.innerHeight };

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

  // Restore the viewport a test may have resized (see initialViewport above)
  window.innerWidth = initialViewport.width;
  window.innerHeight = initialViewport.height;
});
