/**
 * Pure display-format helpers for the replay packet list (the timeline tape's
 * math and the per-second density bars retired with bucket mode). No Angular,
 * no DOM — directly unit-testable.
 *
 * ts handling: `Number(ts)` appears ONLY in this file, and only for DISPLAY.
 * The strings themselves are never re-serialized and never sent back to the
 * server from here.
 */

// ---------------------------------------------------------------------------
// Time display (HH:MM:SS local; µs precision kept in the delta only)
// ---------------------------------------------------------------------------

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Whole epoch seconds → local "HH:MM:SS". */
export function formatSeconds(sec: number): string {
  const d = new Date(sec * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * Frame ts string → local "HH:MM:SS.ffffff" (µs precision, straight from the
 * string's fraction — no float rounding). Display only; the string itself
 * never changes and never travels back to the server.
 */
export function formatFrameTime(ts: string): string {
  const [sec, frac = ''] = ts.split('.');
  const micros = (frac + '000000').slice(0, 6);
  return `${formatSeconds(Number(sec))}.${micros}`;
}

/** Wireshark-style relative time: "+1.234s" from the list's first frame. */
export function formatDelta(ts: string, firstTs: string): string {
  const delta = Number(ts) - Number(firstTs);
  const sign = delta < 0 ? '−' : '+';
  return `${sign}${Math.abs(delta).toFixed(3)}s`;
}
