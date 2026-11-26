import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, sanitizeFileName } from './file-download.util';

describe('sanitizeFileName', () => {
  it('replaces characters that are unsafe on common platforms', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
    expect(sanitizeFileName('tab\tname\u0000')).toBe('tab_name_');
  });
  it('removes trailing dots and spaces and protects Windows reserved names', () => {
    expect(sanitizeFileName('config. . ')).toBe('config');
    expect(sanitizeFileName('NUL')).toBe('_NUL');
    expect(sanitizeFileName('com1.txt')).toBe('_com1.txt');
    expect(sanitizeFileName('console.cfg')).toBe('console.cfg');
  });
  it('falls back for empty or dot-only names and caps the length while keeping the extension', () => {
    expect(sanitizeFileName('')).toBe('download');
    expect(sanitizeFileName(undefined, 'x')).toBe('x');
    expect(sanitizeFileName('...', 'x')).toBe('x');
    const long = sanitizeFileName('a'.repeat(400) + '.cfg');
    expect(long.length).toBe(150);
    expect(long.endsWith('.cfg')).toBe(true);
  });
});

describe('downloadBlob', () => {
  let click: ReturnType<typeof vi.spyOn>;
  let create: ReturnType<typeof vi.fn<(blob: Blob | MediaSource) => string>>;
  let revoke: ReturnType<typeof vi.fn<(url: string) => void>>;
  beforeEach(() => {
    create = vi.fn(() => 'blob:x');
    revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = create;
        static revokeObjectURL = revoke;
      },
    );
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('clicks an anchor that is attached while clicking, named safely, then removes it', () => {
    let attached = false;
    click.mockImplementation(function (this: HTMLAnchorElement) {
      attached = document.body.contains(this);
      expect(this.download).toBe('a_b.cfg');
      expect(this.href).toContain('blob:x');
    });
    downloadBlob('a/b.cfg', new Blob(['x']));
    expect(attached).toBe(true);
    expect(document.querySelector('a[download]')).toBeNull();
  });
  it('revokes the object URL only after one second', async () => {
    downloadBlob('x.cfg', new Blob(['x']));
    await vi.advanceTimersByTimeAsync(999);
    expect(revoke).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });
  it('revokes and cleans up even when the click throws', async () => {
    click.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => downloadBlob('x.cfg', new Blob(['x']))).toThrow('blocked');
    expect(document.querySelector('a[download]')).toBeNull();
    await vi.advanceTimersByTimeAsync(1000);
    expect(revoke).toHaveBeenCalled();
  });
});
