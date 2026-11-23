/**
 * Persistent geometry for the replay floating windows — the MAIN window's
 * rect (position + size) and the pinned windows' remembered tile size —
 * stored as ONE JSON blob under {@link REPLAY_WINDOW_STATE_KEY} through the
 * {@link UserPreferencesService} facade (localStorage working copy, mirrored
 * to the controller's per-user document — the geometry follows the user
 * across browsers).
 *
 * Scope on purpose: the PEEK window and each pin's freed POSITION are
 * session-only — pins are session objects (they die with the replay
 * session), and the peek is a transient glance. Only durable preferences
 * live here.
 *
 * Values are stored RAW (px); every consumer clamps at USE time against the
 * CURRENT viewport and minimum sizes, so a rect saved on a 4K desktop
 * degrades safely on a laptop (the same contract as the other synced
 * floating-widget geometry keys).
 */

/** localStorage / per-user-document key (see SYNCED_PREFERENCE_KEYS). */
export const REPLAY_WINDOW_STATE_KEY = 'gns3_replay_window_state';

/** The main window's settled rect, viewport px. */
export interface ReplayMainRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Loose sanity floors — parse-time only; real minimums apply at use time. */
const MIN_STORED_W = 200;
const MIN_STORED_H = 160;

/** What the blob parsed into (each part validated independently). */
export interface ParsedReplayWindowState {
  main: ReplayMainRect | null;
  pin: { width: number; height: number } | null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseRect(v: unknown): ReplayMainRect | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Record<string, unknown>;
  if (!isNum(r.left) || !isNum(r.top) || !isNum(r.width) || !isNum(r.height)) return null;
  if (r.left < 0 || r.top < 0 || r.width < MIN_STORED_W || r.height < MIN_STORED_H) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function parseSize(v: unknown): { width: number; height: number } | null {
  if (typeof v !== 'object' || v === null) return null;
  const s = v as Record<string, unknown>;
  if (!isNum(s.width) || !isNum(s.height)) return null;
  if (s.width < MIN_STORED_W || s.height < MIN_STORED_H) return null;
  return { width: s.width, height: s.height };
}

/**
 * Read/modify/write the state blob through caller-supplied accessors —
 * in production both point at the {@link UserPreferencesService} facade
 * (localStorage + profile sync); specs can pass plain Maps.
 */
export class ReplayWindowStore {
  constructor(
    private readonly get: (key: string) => string | null,
    private readonly set: (key: string, value: string) => void
  ) {}

  /** Parse + validate the stored blob (absent/corrupt/out-of-range parts
   * fall back to null, i.e. the caller's defaults). */
  load(): ParsedReplayWindowState {
    const raw = this.get(REPLAY_WINDOW_STATE_KEY);
    if (!raw) return { main: null, pin: null };
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return { main: parseRect(parsed['main']), pin: parseSize(parsed['pin']) };
    } catch {
      return { main: null, pin: null };
    }
  }

  /** Persist the MAIN window's rect (merge — the pin part survives untouched). */
  storeMain(rect: ReplayMainRect): void {
    this.set(REPLAY_WINDOW_STATE_KEY, JSON.stringify({ ...this.load(), main: rect }));
  }

  /** Persist the pin tile size (merge — the main rect survives untouched). */
  storePinSize(size: { width: number; height: number }): void {
    this.set(REPLAY_WINDOW_STATE_KEY, JSON.stringify({ ...this.load(), pin: size }));
  }
}
