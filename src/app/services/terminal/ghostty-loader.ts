import { Ghostty } from 'ghostty-web';

let ghosttyPromise: Promise<Ghostty> | null = null;

const WASM_PATH_CANDIDATES: Array<string | undefined> = [
  undefined,
  'ghostty-vt.wasm',
  './ghostty-vt.wasm',
  '/ghostty-vt.wasm',
  '/static/web-ui/ghostty-vt.wasm',
];

export function loadGhostty(): Promise<Ghostty> {
  if (!ghosttyPromise) {
    ghosttyPromise = (async () => {
      let lastError: unknown = null;

      for (const wasmPath of WASM_PATH_CANDIDATES) {
        try {
          return await Ghostty.load(wasmPath);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError ?? new Error('Failed to initialize ghostty-web');
    })().catch((error) => {
      // Allow later calls to retry loading after transient failures.
      ghosttyPromise = null;
      throw error;
    });
  }

  return ghosttyPromise;
}
