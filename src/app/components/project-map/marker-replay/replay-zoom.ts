/**
 * Per-window CONTENT zoom for the replay floating windows (main window,
 * pinned comparison windows, peek window).
 *
 * Each window owns an independent zoom level, applied as CSS `zoom` on the
 * window's CONTENT region only — the chrome (header, borders, resize
 * handles) stays 1:1, so every px-based geometry system (drag, resize,
 * snapping, dock slots, leader lines) is untouched by zooming. CSS `zoom`
 * (not `transform: scale()`) on purpose: it is a LAYOUT scaling, so the
 * scrollports' ranges and the flex-stretched content boxes resize with it
 * instead of overflowing or leaving gaps.
 *
 * Levels live in localStorage per window KIND (`main` / `pin` / `peek`): a
 * new window is BORN at its kind's last-used level (every later pin matches
 * the pin the user last zoomed), then adjusts independently per window.
 * Session-scoped siblings of this state (window size) live in
 * {@link MarkerReplayService.rememberWindowSize}; zoom outlives the session
 * because a comfortable reading size is a preference, not a layout accident.
 */

import { WritableSignal, computed, signal } from '@angular/core';

/** Zoom range and step — 70%…200% in 10% steps (Wireshark-like font zoom). */
export const REPLAY_ZOOM_MIN = 0.7;
export const REPLAY_ZOOM_MAX = 2;
export const REPLAY_ZOOM_STEP = 0.1;
export const REPLAY_ZOOM_DEFAULT = 1;

const STORAGE_PREFIX = 'gns3_replay_zoom_';

/** Clamp + de-drift a zoom value onto the 10%-step grid (integer per-cent). */
export function clampReplayZoom(zoom: number): number {
  const pct = Math.round(zoom * 100);
  const stepped = Math.round(pct / (REPLAY_ZOOM_STEP * 100)) * (REPLAY_ZOOM_STEP * 100);
  return Math.min(REPLAY_ZOOM_MAX * 100, Math.max(REPLAY_ZOOM_MIN * 100, stepped)) / 100;
}

/** One step in/out, clamped at the range ends (returns the NEW level). */
export function replayZoomIn(zoom: number): number {
  return clampReplayZoom(zoom + REPLAY_ZOOM_STEP);
}

export function replayZoomOut(zoom: number): number {
  return clampReplayZoom(zoom - REPLAY_ZOOM_STEP);
}

/** The value for `[style.zoom]` — a plain number string, sanitizer-safe. */
export function replayZoomCss(zoom: number): string {
  return clampReplayZoom(zoom).toFixed(2);
}

/** Header caption — "125%". */
export function replayZoomLabel(zoom: number): string {
  return `${Math.round(clampReplayZoom(zoom) * 100)}%`;
}

/**
 * The kind's last-used level (localStorage; `defaultZoom` when absent,
 * unreadable or out of range). Guards: Safari private mode THROWS on access.
 */
export function loadReplayZoom(kind: string, defaultZoom: number = REPLAY_ZOOM_DEFAULT): number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + kind);
    if (raw === null) return defaultZoom;
    const parsed = Number.parseFloat(raw);
    // Unparsable or stale (range-drift) entries fall back rather than clamp —
    // a stored 5.7 from an older range must not pin the window at the max.
    if (!Number.isFinite(parsed) || parsed < REPLAY_ZOOM_MIN || parsed > REPLAY_ZOOM_MAX) {
      return defaultZoom;
    }
    return clampReplayZoom(parsed);
  } catch {
    return defaultZoom;
  }
}

/** Persist the kind's level — best effort, never throws. */
export function storeReplayZoom(kind: string, zoom: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + kind, String(clampReplayZoom(zoom)));
  } catch {
    // Unavailable storage (private mode, disabled) — this-session-only zoom.
  }
}

/**
 * The per-window zoom state, one instance per host component:
 * `readonly zoomCtl = new ReplayZoomController('pin')` in the class body,
 * `[style.zoom]="zoomCtl.css()"` on the content region, the −/%/+ cluster in
 * the header. Every change also becomes the KIND's stored default, so later
 * windows of the same kind (new pins especially) are born at it.
 */
export class ReplayZoomController {
  /** Assigned in the ctor — `kind` (a parameter property) is not set yet at
   * field-initializer time. The computeds below read it lazily, so their
   * field position is safe. */
  readonly zoom: WritableSignal<number>;

  /** `[style.zoom]` value for the content region. */
  readonly css = computed(() => replayZoomCss(this.zoom()));
  /** Header caption — "125%". */
  readonly label = computed(() => replayZoomLabel(this.zoom()));
  readonly canStepUp = computed(() => this.zoom() < REPLAY_ZOOM_MAX);
  readonly canStepDown = computed(() => this.zoom() > REPLAY_ZOOM_MIN);

  constructor(private readonly kind: 'main' | 'pin' | 'peek') {
    this.zoom = signal(loadReplayZoom(kind));
  }

  stepUp(): void {
    this.apply(replayZoomIn(this.zoom()));
  }

  stepDown(): void {
    this.apply(replayZoomOut(this.zoom()));
  }

  /** The level readout's click — back to 100%. */
  reset(): void {
    this.apply(REPLAY_ZOOM_DEFAULT);
  }

  private apply(zoom: number): void {
    this.zoom.set(clampReplayZoom(zoom));
    storeReplayZoom(this.kind, zoom);
  }
}
