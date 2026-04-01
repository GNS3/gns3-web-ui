/**
 * Vitest setup file for Angular tests
 * This file is loaded before all tests
 */

// Set up global test utilities
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { DOCUMENT } from '@angular/common';
import { vi, beforeEach, describe, it } from 'vitest';

// Debug: Log that setup is running
console.log('[setup-vitest] Initializing TestBed...');

// Initialize TestBed environment for Angular
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  {
    teardown: { destroyAfterEach: false }
  }
);

// Make TestBed available globally for convenience
globalThis.TestBed = TestBed;

// Provide DOCUMENT token globally for all tests
// This is needed for TestComponentRenderer in Angular 21 zoneless
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: document }
    ]
  });
});

// Add jasmine-like xit and xdescribe for skipped tests
globalThis.xit = it.skip;
globalThis.xdescribe = describe.skip;
globalThis.fit = it.only;
globalThis.fdescribe = describe.only;

// Create jasmine-compatible spyOn wrapper
globalThis.spyOn = (obj, method) => {
  // Get original method before spying
  const originalMethod = obj[method];
  const spy = vi.spyOn(obj, method);
  // Add jasmine-like .and property
  spy.and = {
    callThrough: () => spy.mockImplementation(function(...args) {
      // Call through to original implementation
      return originalMethod.apply(obj, args);
    }),
    returnValue: (val) => spy.mockReturnValue(val),
    returnValues: (...vals) => spy.mockReturnValues(...vals),
    callFake: (fn) => spy.mockImplementation(fn),
    throwError: (err) => spy.mockImplementation(() => { throw err; }),
  };
  return spy;
};

console.log('[setup-vitest] TestBed initialized');
