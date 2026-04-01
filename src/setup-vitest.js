/**
 * Vitest setup file for Angular tests
 * This file is loaded before all tests
 */

// MUST be first import - forces JIT compiler facade registration before Angular modules initialize
import '@angular/compiler';

import { DOCUMENT, ɵgetDOM } from '@angular/common';

// Polyfill for jsdom missing SVGAnimatedTransformList.baseVal
// d3-zoom requires this to handle SVG transformations
// Must polyfill on SVGSVGElement specifically since d3-zoom calls defaultExtent on it
if (typeof SVGSVGElement !== 'undefined') {
  // First, polyfill baseVal if it doesn't exist on SVGSVGElement instances
  if (!('baseVal' in SVGSVGElement.prototype)) {
    Object.defineProperty(SVGSVGElement.prototype, 'baseVal', {
      get: function () {
        if (!this._baseVal) {
          const self = this;
          this._baseVal = {
            value: null,
            consolidate: function () {
              return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, skewX: function() { return 0; }, translate: function() { return { x: 0, y: 0 }; } };
            },
            numberOfItems: 0,
            appendItem: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
            clear: function () {},
            getItem: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
            initialize: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
            insertItemBefore: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
            removeItem: function () {},
            replaceItem: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
            createSVGTransformFromMatrix: function () { return { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }; },
          };
        }
        return this._baseVal;
      },
      set: function (val) {
        this._baseVal = val;
      },
      configurable: true,
      enumerable: true,
    });
  }

  // Polyfill defaultExtent that d3-zoom calls
  if (!('defaultExtent' in SVGSVGElement.prototype)) {
    SVGSVGElement.prototype.defaultExtent = function () {
      return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, skewX: function() { return 0; }, translate: function() { return { x: 0, y: 0 }; } };
    };
  }
}

// Also polyfill on SVGElement for any code that uses SVGElement.transform
if (typeof SVGElement !== 'undefined') {
  Object.defineProperty(SVGElement.prototype, 'transform', {
    get: function () {
      return this._transform || (this._transform = {
        baseVal: {
          value: null,
          consolidate: () => ({ matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } }),
          numberOfItems: 0,
        },
      });
    },
    set: function (val) {
      this._transform = val;
    },
    configurable: true,
    enumerable: true,
  });
}
import { TestBed } from '@angular/core/testing';
import { createPlatformFactory } from '@angular/core';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { ɵBrowserDomAdapter } from '@angular/platform-browser';
import { afterEach, beforeAll } from 'vitest';

// IMPORTANT: Make BrowserDomAdapter current before any Angular code runs
// This sets up the global _DOM variable that Angular's getDOM() relies on
ɵBrowserDomAdapter.makeCurrent();

// Create custom platform that inherits from platformBrowserDynamicTesting and adds DOCUMENT
const customPlatformFactory = createPlatformFactory(
  platformBrowserDynamicTesting,
  'customBrowserTesting',
  [{ provide: DOCUMENT, useValue: document }]
);

beforeAll(() => {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    customPlatformFactory(),
    {
      teardown: { destroyAfterEach: false },
    }
  );
});

afterEach(() => {
  TestBed.resetTestingModule();
});

// Make TestBed available globally for convenience
globalThis.TestBed = TestBed;

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
