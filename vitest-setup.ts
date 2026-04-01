/**
 * Vitest setup file for Angular 21 Zoneless tests
 * This file is loaded before all tests
 */

console.log('[vitest.setup.ts] Setting up test environment...');

// First, define the compatibility globals before any test code runs
// These need to be defined synchronously before test files are imported
const g = globalThis as any;

// Define xdescribe, xit, xtest as no-op skip functions
// These will be properly replaced when describe/it become available
g.xdescribe = (name: string, fn: any) => {
  console.log(`[vitest.setup.ts] xdescribe called for: ${name} - skipping`);
};

g.xit = (name: string, fn: any) => {
  console.log(`[vitest.setup.ts] xit called for: ${name} - skipping`);
};

g.xtest = (name: string, fn: any) => {
  console.log(`[vitest.setup.ts] xtest called for: ${name} - skipping`);
};

// fdescribe and fit for focused tests
g.fdescribe = (name: string, fn: any) => {
  console.log(`[vitest.setup.ts] fdescribe called for: ${name} - focusing`);
};

g.fit = (name: string, fn: any) => {
  console.log(`[vitest.setup.ts] fit called for: ${name} - focusing`);
};

console.log('[vitest.setup.ts] Compatibility globals defined');

// Now import and setup Angular testing
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import '@angular/platform-browser/animations/async';

console.log('[vitest.setup.ts] Initializing TestBed...');

// Initialize TestBed environment for Angular 21 Zoneless
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  {
    teardown: {
      destroyAfterEach: false,
      rethrowErrors: true,
    },
  },
);

// Make TestBed available globally for convenience
g.TestBed = TestBed;

console.log('[vitest.setup.ts] TestBed initialized');

// After globals are available, update the skip functions to use proper Vitest API
if (g.describe && g.describe.skip) {
  g.xdescribe = g.describe.skip;
}
if (g.it && g.it.skip) {
  g.xit = g.it.skip;
  g.xtest = g.it.skip;
}
if (g.describe && g.describe.only) {
  g.fdescribe = g.describe.only;
}
if (g.it && g.it.only) {
  g.fit = g.it.only;
}

console.log('[vitest.setup.ts] Setup complete');
