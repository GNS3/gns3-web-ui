/**
 * CDK polyfill setup for Angular CDK MediaMatcher, FocusMonitor, and HighContrastModeDetector
 *
 * Angular CDK's passive-listeners.ts calls window.addEventListener at module load time.
 * Angular CDK's MediaMatcher injects DOCUMENT and accesses document.body.querySelector.
 * Angular CDK's HighContrastModeDetector accesses document.body.classList.
 * These may not exist or be fully functional in JSDOM before a body is created.
 */

import { vi } from 'vitest';

// Fix window.addEventListener for Angular CDK FocusMonitor
if (typeof window !== 'undefined' && !window.addEventListener) {
  (window as any).addEventListener = vi.fn();
  (window as any).removeEventListener = vi.fn();
}

// Ensure document.body exists and has querySelector and classList for Angular CDK
if (typeof document !== 'undefined') {
  if (!document.body) {
    document.body = document.createElement('body');
  }
  if (typeof document.body.querySelector !== 'function') {
    (document.body as any).querySelector = vi.fn();
  }
  if (typeof document.body.querySelectorAll !== 'function') {
    (document.body as any).querySelectorAll = vi.fn(() => []);
  }
  // Mock classList for HighContrastModeDetector
  if (!document.body.classList) {
    const classListMock = {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(() => false),
      item: vi.fn(),
      length: 0,
    };
    (document.body as any).classList = classListMock;
  }
}
