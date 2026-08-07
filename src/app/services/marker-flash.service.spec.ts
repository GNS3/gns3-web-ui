import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { MarkerFlashService } from './marker-flash.service';

/**
 * MarkerFlashService stores per-(linkId, dir) flash state in the `_flashing` signal
 * and schedules independent per-slot续命 timers. We assert on the signal / timer
 * behaviour directly; DOM side-effects require an SVG and are exercised manually.
 */

/** Match the composite-key separator used in the service (null-byte). */
const SEP = '\x00';
const key = (linkId: string, dir: 'tx' | 'rx' | null = null) => `${linkId}${SEP}${dir ?? 'none'}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoredState = { color: string | null; dir: 'tx' | 'rx' | null; captureNodeId: string | null; _seq: number };

describe('MarkerFlashService', () => {
  let service: MarkerFlashService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flashing = () => (service as any)._flashing() as ReadonlyMap<string, StoredState>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [MarkerFlashService] });
    service = TestBed.inject(MarkerFlashService);
  });

  it('adds the link to the active set immediately on flash()', () => {
    service.flash('link-1', null);
    expect(flashing().has(key('link-1'))).toBe(true);
  });

  it('stores the latest color on repeat flash()', () => {
    service.flash('link-1', 'red');
    service.flash('link-1', 'blue');
    expect(flashing().get(key('link-1'))?.color).toBe('blue');
  });

  it('stores dir + captureNodeId for the direction arrow', () => {
    service.flash('link-1', null, null, 'tx', 'node-a');
    const state = flashing().get(key('link-1', 'tx'));
    expect(state?.dir).toBe('tx');
    expect(state?.captureNodeId).toBe('node-a');
  });

  it('defaults dir + captureNodeId to null when omitted (legacy uBridge)', () => {
    service.flash('link-1', null);
    const state = flashing().get(key('link-1'));
    expect(state?.dir).toBeNull();
    expect(state?.captureNodeId).toBeNull();
  });

  /**
   * Direction semantics (pure logic — the path is always drawn source→target).
   * `dir` is relative to the capture node, so the arrow follows the path only for
   * tx-from-source and rx-at-target; every other case points against the path.
   */
  describe('arrowPointsAlongPath (direction semantics)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arrowAlong = (dir: 'tx' | 'rx', capture: 'source' | 'target') =>
      (MarkerFlashService as any).arrowPointsAlongPath(dir, capture === 'source', capture === 'target');

    it('tx from the source end flows source→target (along the path)', () => {
      expect(arrowAlong('tx', 'source')).toBe(true);
    });

    it('rx at the target end means peer(source)→capture(target) (along the path)', () => {
      expect(arrowAlong('rx', 'target')).toBe(true);
    });

    it('tx from the target end flows target→source (against the path)', () => {
      expect(arrowAlong('tx', 'target')).toBe(false);
    });

    it('rx at the source end means peer(target)→capture(source) (against the path)', () => {
      expect(arrowAlong('rx', 'source')).toBe(false);
    });
  });

  describe('with fake timers', () => {
    beforeAll(() => vi.useFakeTimers());
    afterAll(() => vi.useRealTimers());

    it('expires after the default 800ms', () => {
      service.flash('link-default', null);
      vi.advanceTimersByTime(799);
      expect(flashing().has(key('link-default'))).toBe(true);
      vi.advanceTimersByTime(2);
      expect(flashing().has(key('link-default'))).toBe(false);
    });

    it('honors a custom durationMs (1200ms)', () => {
      service.flash('link-custom', null, 1200);
      vi.advanceTimersByTime(800);
      expect(flashing().has(key('link-custom'))).toBe(true);
      vi.advanceTimersByTime(399);
      expect(flashing().has(key('link-custom'))).toBe(true);
      vi.advanceTimersByTime(2);
      expect(flashing().has(key('link-custom'))).toBe(false);
    });

    it('续命: a repeat flash within the window resets the timer', () => {
      service.flash('link-renew', null); // 800ms timer
      vi.advanceTimersByTime(500); // 300ms left on original
      service.flash('link-renew', null); // reset to a fresh 800ms
      vi.advanceTimersByTime(500); // original would have expired; reset still has 300ms
      expect(flashing().has(key('link-renew'))).toBe(true);
      vi.advanceTimersByTime(300);
      expect(flashing().has(key('link-renew'))).toBe(false);
    });

    it('方向变化不续命: tx and rx coexist with independent timers', () => {
      // tx at t=0, rx at t=200
      service.flash('link-1', null, null, 'tx', 'node-a');
      vi.advanceTimersByTime(200);
      service.flash('link-1', null, null, 'rx', 'node-b');

      // Both active right after the rx call.
      expect(flashing().has(key('link-1', 'tx'))).toBe(true);
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);

      // tx timer (800ms, set at t=0) expires at t=800. Advance past it.
      vi.advanceTimersByTime(601); // total 801ms elapsed
      expect(flashing().has(key('link-1', 'tx'))).toBe(false);
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);

      // rx timer (800ms, set at t=200) expires at t=1000.
      vi.advanceTimersByTime(200); // total 1001ms elapsed
      expect(flashing().has(key('link-1', 'rx'))).toBe(false);
    });

    it('续命 only for same direction, not across directions', () => {
      service.flash('link-1', 'red', null, 'tx', 'node-a');
      vi.advanceTimersByTime(700); // 100ms left on tx
      // Different direction — should NOT reset tx timer.
      service.flash('link-1', 'blue', null, 'rx', 'node-b');
      // tx still has its original timer
      vi.advanceTimersByTime(101); // tx expired, rx still active
      expect(flashing().has(key('link-1', 'tx'))).toBe(false);
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);
      // Same direction should续命
      service.flash('link-1', null, null, 'rx', 'node-b');
      vi.advanceTimersByTime(700); // rx should still be alive (timer reset at second rx call)
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);
    });
  });
});
