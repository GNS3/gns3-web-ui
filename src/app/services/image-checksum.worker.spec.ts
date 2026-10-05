import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';

it('computes MD5 incrementally for empty, small, and multiple-chunk files and reports read failures', async () => {
  const scope = { onmessage: null, postMessage: vi.fn() };
  vi.stubGlobal('self', scope);
  try {
    await import('./image-checksum.worker');
    for (const content of [
      new Uint8Array(),
      new TextEncoder().encode('abc'),
      new Uint8Array(4 * 1024 * 1024 + 17).fill(97),
    ]) {
      scope.postMessage.mockClear();
      const slice = vi.fn((start: number, end: number) => ({
        arrayBuffer: async () => content.slice(start, end).buffer,
      }));
      await scope.onmessage({ data: { size: content.length, slice } });
      expect(scope.postMessage).toHaveBeenLastCalledWith({
        progress: 100,
        checksum: createHash('md5').update(content).digest('hex'),
      });
      expect(slice.mock.calls.every(([start, end]) => end - start <= 4 * 1024 * 1024)).toBe(true);
      if (content.length > 4 * 1024 * 1024) expect(slice).toHaveBeenCalledTimes(2);
    }
    await scope.onmessage({
      data: { size: 10, slice: () => ({ arrayBuffer: () => Promise.reject(new Error('Read failed')) }) },
    });
    expect(scope.postMessage).toHaveBeenLastCalledWith({ error: 'The selected file could not be read.' });
  } finally {
    vi.unstubAllGlobals();
  }
});
