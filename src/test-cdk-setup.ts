/**
 * CDK polyfill setup for Angular CDK FocusMonitor
 *
 * Angular CDK's passive-listeners.ts calls window.addEventListener at module load time.
 * This file ensures window.addEventListener exists before CDK modules load.
 */

import { vi } from 'vitest';

// Fix window.addEventListener for Angular CDK FocusMonitor
if (typeof window !== 'undefined' && !window.addEventListener) {
  (window as any).addEventListener = vi.fn();
  (window as any).removeEventListener = vi.fn();
}
