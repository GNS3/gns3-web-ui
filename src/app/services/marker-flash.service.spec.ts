import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { MarkerFlashService } from './marker-flash.service';

/**
 * MarkerFlashService stores per-(linkId, dir) flash state in the `_flashing` signal
 * and schedules independent per-slot debounce timers. flash() only stages into a per-frame
 * buffer; a requestAnimationFrame flush applies it. We assert on the signal / timer
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

  /**
   * flush() is driven by requestAnimationFrame. Defer it to a microtask so it runs
   * outside Angular's synchronous scheduling (avoids "cannot synchronously execute
   * watches while scheduling"). `settle()` lets that microtask fire before we assert.
   * Re-stubbed in beforeEach so it wins over vi.useFakeTimers()'s faked rAF.
   */
  const settle = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queueMicrotask(() => cb(0));
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    TestBed.configureTestingModule({ providers: [MarkerFlashService] });
    service = TestBed.inject(MarkerFlashService);
  });

  it('adds the link to the active set once the frame flushes', async () => {
    service.flash('link-1', null);
    await settle();
    expect(flashing().has(key('link-1'))).toBe(true);
  });

  it('stores the latest color on repeat flash()', async () => {
    service.flash('link-1', 'red');
    service.flash('link-1', 'blue');
    await settle();
    expect(flashing().get(key('link-1'))?.color).toBe('blue');
  });

  it('stores dir + captureNodeId for the direction arrow', async () => {
    service.flash('link-1', null, null, 'tx', 'node-a');
    await settle();
    const state = flashing().get(key('link-1', 'tx'));
    expect(state?.dir).toBe('tx');
    expect(state?.captureNodeId).toBe('node-a');
  });

  it('defaults dir + captureNodeId to null when omitted (legacy uBridge)', async () => {
    service.flash('link-1', null);
    await settle();
    const state = flashing().get(key('link-1'));
    expect(state?.dir).toBeNull();
    expect(state?.captureNodeId).toBeNull();
  });

  it('coalesces same-direction matches within a frame to one state write', async () => {
    // Three matches on the same (link,dir) before the flush fires: only the last
    // color should land, and the signal should update once.
    service.flash('link-1', 'red', null, 'tx', 'node-a');
    service.flash('link-1', 'green', null, 'tx', 'node-a');
    service.flash('link-1', 'blue', null, 'tx', 'node-a');
    await settle();
    expect(flashing().get(key('link-1', 'tx'))?.color).toBe('blue');
    expect(flashing().size).toBe(1);
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

    it('expires after the default 800ms', async () => {
      service.flash('link-default', null);
      await settle();
      vi.advanceTimersByTime(799);
      expect(flashing().has(key('link-default'))).toBe(true);
      vi.advanceTimersByTime(2);
      expect(flashing().has(key('link-default'))).toBe(false);
    });

    it('honors a custom durationMs (1200ms)', async () => {
      service.flash('link-custom', null, 1200);
      await settle();
      vi.advanceTimersByTime(800);
      expect(flashing().has(key('link-custom'))).toBe(true);
      vi.advanceTimersByTime(399);
      expect(flashing().has(key('link-custom'))).toBe(true);
      vi.advanceTimersByTime(2);
      expect(flashing().has(key('link-custom'))).toBe(false);
    });

    it('renew: a repeat flash within the window resets the timer', async () => {
      service.flash('link-renew', null); // 800ms timer
      await settle();
      vi.advanceTimersByTime(500); // 300ms left on original
      service.flash('link-renew', null); // reset to a fresh 800ms
      await settle();
      vi.advanceTimersByTime(500); // original would have expired; reset still has 300ms
      expect(flashing().has(key('link-renew'))).toBe(true);
      vi.advanceTimersByTime(300);
      expect(flashing().has(key('link-renew'))).toBe(false);
    });

    it('cross-direction: tx and rx coexist with independent timers', async () => {
      // tx at t=0, rx at t=200
      service.flash('link-1', null, null, 'tx', 'node-a');
      await settle();
      vi.advanceTimersByTime(200);
      service.flash('link-1', null, null, 'rx', 'node-b');
      await settle();

      // Both active right after the rx flush.
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

    it('renew only for same direction, not across directions', async () => {
      service.flash('link-1', 'red', null, 'tx', 'node-a');
      await settle();
      vi.advanceTimersByTime(700); // 100ms left on tx
      // Different direction — should NOT reset tx timer.
      service.flash('link-1', 'blue', null, 'rx', 'node-b');
      await settle();
      // tx still has its original timer
      vi.advanceTimersByTime(101); // tx expired, rx still active
      expect(flashing().has(key('link-1', 'tx'))).toBe(false);
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);
      // Same direction should renew
      service.flash('link-1', null, null, 'rx', 'node-b');
      await settle();
      vi.advanceTimersByTime(700); // rx should still be alive (timer reset at second rx call)
      expect(flashing().has(key('link-1', 'rx'))).toBe(true);
    });
  });
});
