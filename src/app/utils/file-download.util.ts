/** Characters that are unsafe in file names on common desktop platforms. */
const UNSAFE_FILE_NAME = /[\\/:*?"<>|\x00-\x1f\x7f]/g;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

/**
 * Make a string safe to use as a download file name. Never returns an empty
 * string: callers get `fallback` when nothing usable is left.
 */
export function sanitizeFileName(name: string | null | undefined, fallback = 'download'): string {
  let clean = (name ?? '')
    .replace(UNSAFE_FILE_NAME, '_')
    .trim()
    .replace(/[. ]+$/, '');
  if (clean.length > 150) {
    const dot = clean.lastIndexOf('.');
    const extension = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : '';
    clean = clean.slice(0, 150 - extension.length) + extension;
  }
  if (!clean || /^\.+$/.test(clean)) return fallback;
  return WINDOWS_RESERVED_NAME.test(clean) ? `_${clean}` : clean;
}

/**
 * Save a blob through a temporary anchor. The anchor is attached to the
 * document (some browsers ignore clicks on detached anchors) and the object
 * URL is revoked only after the browser has had time to start the download.
 */
export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFileName(name);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
