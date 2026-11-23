import { describe, it, expect } from 'vitest';
import {
  ReplayZoomController,
  REPLAY_ZOOM_DEFAULT,
  REPLAY_ZOOM_MAX,
  REPLAY_ZOOM_MIN,
} from './replay-zoom';

/**
 * Map-backed accessors standing in for the UserPreferencesService facade —
 * the exact seam production wiring passes (get/set by key; specs can pass
 * plain Maps, same contract as ReplayWindowStore).
 */
function mapStorage(): {
  store: Map<string, string>;
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
} {
  const store = new Map<string, string>();
  return {
    store,
    get: (key) => store.get(key) ?? null,
    set: (key, value) => void store.set(key, value),
  };
}

describe('ReplayZoomController', () => {
  it('is born at the kind stored level', () => {
    const { store, get, set } = mapStorage();
    store.set('gns3_replay_zoom_pin', '1.3');
    const ctl = new ReplayZoomController('pin', get, set);
    expect(ctl.zoom()).toBe(1.3);
    expect(ctl.label()).toBe('130%');
    expect(ctl.css()).toBe('1.30');
  });

  it('is born at the default when the kind has no stored level', () => {
    const { get, set } = mapStorage();
    expect(new ReplayZoomController('main', get, set).zoom()).toBe(REPLAY_ZOOM_DEFAULT);
  });

  it('falls back to the default — not a clamp to the max — for stale out-of-range entries', () => {
    const { store, get, set } = mapStorage();
    store.set('gns3_replay_zoom_peek', '5.7'); // stored by an older zoom range
    expect(new ReplayZoomController('peek', get, set).zoom()).toBe(REPLAY_ZOOM_DEFAULT);
  });

  it('falls back to the default for unparsable entries', () => {
    const { store, get, set } = mapStorage();
    store.set('gns3_replay_zoom_main', 'big');
    expect(new ReplayZoomController('main', get, set).zoom()).toBe(REPLAY_ZOOM_DEFAULT);
  });

  it('survives throwing accessors (Safari private mode)', () => {
    const boom = () => {
      throw new Error('storage unavailable');
    };
    const ctl = new ReplayZoomController('pin', boom, boom);
    expect(ctl.zoom()).toBe(REPLAY_ZOOM_DEFAULT);
    expect(() => ctl.stepUp()).not.toThrow();
    expect(ctl.zoom()).toBe(1.1); // this-session-only zoom
  });

  it('persists every change onto the kind own key, so later windows are born at it', () => {
    const { store, get, set } = mapStorage();
    const ctl = new ReplayZoomController('pin', get, set);
    ctl.stepUp(); // 1 -> 1.1
    ctl.stepUp(); // 1.1 -> 1.2
    expect(store.get('gns3_replay_zoom_pin')).toBe('1.2');
    expect(new ReplayZoomController('pin', get, set).zoom()).toBe(1.2);
  });

  it('keeps kinds isolated — a pin write never touches main or peek', () => {
    const { store, get, set } = mapStorage();
    new ReplayZoomController('pin', get, set).stepUp();
    expect(store.has('gns3_replay_zoom_main')).toBe(false);
    expect(store.has('gns3_replay_zoom_peek')).toBe(false);
  });

  it('clamps stepping at the range ends', () => {
    const { store, get, set } = mapStorage();
    store.set('gns3_replay_zoom_main', String(REPLAY_ZOOM_MAX));
    const high = new ReplayZoomController('main', get, set);
    high.stepUp();
    expect(high.zoom()).toBe(REPLAY_ZOOM_MAX);
    expect(high.canStepUp()).toBe(false);

    store.set('gns3_replay_zoom_main', String(REPLAY_ZOOM_MIN));
    const low = new ReplayZoomController('main', get, set);
    low.stepDown();
    expect(low.zoom()).toBe(REPLAY_ZOOM_MIN);
    expect(low.canStepDown()).toBe(false);
  });

  it('reset() returns to 100% and persists it', () => {
    const { store, get, set } = mapStorage();
    store.set('gns3_replay_zoom_peek', '1.5');
    const ctl = new ReplayZoomController('peek', get, set);
    ctl.reset();
    expect(ctl.zoom()).toBe(1);
    expect(store.get('gns3_replay_zoom_peek')).toBe('1');
    expect(new ReplayZoomController('peek', get, set).zoom()).toBe(1);
  });
});
