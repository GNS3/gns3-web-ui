/**
 * Vitest setup file for Angular tests
 * This file is loaded before all tests
 */

// Zoneless Angular doesn't need zone.js
// Import Angular testing utilities
import '@angular/core/testing';
import '@angular/platform-browser/animations/async';

// Set up global test utilities
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

// Debug: Log that setup is running
console.log('[setup-vitest] Initializing TestBed...');

// Initialize TestBed environment for Angular
TestBed.initTestEnvironment(BrowserDynamicTestingModule, {
  teardown: { destroyAfterEach: false }
});

// Make TestBed available globally for convenience
(window as any).TestBed = TestBed;

// Add global describe, it, expect from Vitest
// These are already available globally in Vitest

console.log('[setup-vitest] TestBed initialized');
