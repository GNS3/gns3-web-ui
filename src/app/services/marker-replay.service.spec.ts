import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { MarkerReplayService } from './marker-replay.service';
import { Controller } from '@models/controller';
import { ReplayFrame, ReplayFrameDetail, ReplayRangeResponse } from '@models/marker-replay';
import { ToasterService } from './toaster.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ctrl = { id: 1 } as Controller;
const PROJECT_ID = 'proj-1';
const TAG = 666;

function frame(ts: string, linkId: string, frameNumber: number, marker = 'global-def'): ReplayFrame {
  return { ts, len: 60, node_id: 'n1', link_id: linkId, marker, frame_number: frameNumber };
}

const F0 = frame('1788196663.100000', 'l1', 1);
const F1 = frame('1788196663.200000', 'l2', 2);
const F2 = frame('1788196663.300000', 'l1', 3);
const G0 = frame('1788196664.010000', 'l2', 1);
const G1 = frame('1788196664.020000', 'l1', 2);
const G2 = frame('1788196664.030000', 'l2', 3);

function rangeOf(frames: ReplayFrame[], over: Partial<ReplayRangeResponse> = {}): ReplayRangeResponse {
  return {
    tag: TAG,
    start: frames[0]?.ts ?? null,
    end: frames[frames.length - 1]?.ts ?? null,
    frame_count: frames.length,
    truncated: false,
    sources: [],
    frames,
    ...over,
  };
}

const truncatedRange: ReplayRangeResponse = {
  tag: TAG,
  start: '1788196663.000000',
  end: '1788196664.000000',
  frame_count: 9000,
  truncated: true,
  sources: [],
  buckets: [
    { ts: '1788196663.000000', count: 2 },
    { ts: '1788196664.000000', count: 3 },
  ],
};

function detailOf(f: ReplayFrame): ReplayFrameDetail {
  return {
    ts: f.ts,
    source: { node_id: f.node_id, link_id: f.link_id, marker: f.marker, frame_number: f.frame_number },
    tshark_version: 'TShark (Wireshark) 4.6.7',
    field_count: 1,
    hex: 'ab',
    tree: [
      { element: 'field', name: 'ip.ttl', showname: `Time to Live: ${f.frame_number}`, show: '64', value: '40', size: '1', pos: '22', children: [] },
    ],
  };
}

/** Server-shaped error: ControllerError carries the HttpErrorResponse as originalError. */
const serverError = (status: number, message: string) => ({
  error: { message },
  message,
  originalError: { status },
});

// ---------------------------------------------------------------------------
// HTTP layer (no state machine)
// ---------------------------------------------------------------------------

describe('MarkerReplayService (HTTP)', () => {
  let service: MarkerReplayService;
  let mockHttpController: any;
  const mockController = { id: 1 } as Controller;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpController = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    service = new MarkerReplayService(mockHttpController, { error: vi.fn() } as unknown as ToasterService);
  });

  describe('replayRange', () => {
    it('→ GET /markers/tags/{tag}/replay/range', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.replayRange(mockController, PROJECT_ID, TAG).subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/range`
      );
      expect(mockHttpController.get).toHaveBeenCalledTimes(1);
    });

    it('forwards errors untouched', () => {
      const err = serverError(409, 'Cannot replay tag 666…');
      mockHttpController.get.mockReturnValue(throwError(() => err));
      service.replayRange(mockController, PROJECT_ID, TAG).subscribe({
        error: (e) => expect(e).toBe(err),
      });
    });
  });

  describe('replayFrames', () => {
    it('→ GET /replay/frames with the ts string VERBATIM and default window/limit', () => {
      mockHttpController.get.mockReturnValue(of({ frames: [] }));
      service.replayFrames(mockController, PROJECT_ID, TAG, truncatedRange.buckets![0].ts).subscribe();
      // Regression: a Number()→String round-trip would yield "1788196663"
      // (dropping ".000000") and the server would 404 the window query.
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/frames?ts=1788196663.000000&window_ms=1000&limit=1000`
      );
    });

    it('passes explicit window/limit through', () => {
      mockHttpController.get.mockReturnValue(of({ frames: [] }));
      service.replayFrames(mockController, PROJECT_ID, TAG, F0.ts, 500, 200).subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/frames?ts=${F0.ts}&window_ms=500&limit=200`
      );
    });

    it('treats an empty frames array as success (no error path)', () => {
      mockHttpController.get.mockReturnValue(of({ frames: [] }));
      const emitted: any[] = [];
      service.replayFrames(mockController, PROJECT_ID, TAG, '1.000000').subscribe((r) => emitted.push(r));
      expect(emitted).toEqual([{ frames: [] }]);
    });
  });

  describe('replayFrameDetail', () => {
    it('→ GET /replay/frame/detail with verbatim ts and encoded marker name', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service
        .replayFrameDetail(mockController, PROJECT_ID, TAG, { ...F0, marker: 'global-def/arp x' })
        .subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/frame/detail?ts=${F0.ts}&node_id=n1&link_id=l1&marker=${encodeURIComponent('global-def/arp x')}`
      );
    });

    it('keeps the µs fraction of ts in the URL (verbatim round-trip regression)', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service
        .replayFrameDetail(mockController, PROJECT_ID, TAG, { ...F0, ts: '1788196663.000000' })
        .subscribe();
      const url: string = mockHttpController.get.mock.calls[0][1];
      expect(url).toContain('ts=1788196663.000000');
      expect(url).not.toContain('ts=1788196663&');
    });

    it('forwards errors untouched', () => {
      const err = serverError(501, 'tshark is not installed…');
      mockHttpController.get.mockReturnValue(throwError(() => err));
      service.replayFrameDetail(mockController, PROJECT_ID, TAG, F0).subscribe({
        error: (e) => expect(e).toBe(err),
      });
    });
  });
});

// ---------------------------------------------------------------------------
// State machine (fake timers drive the 200ms debounces)
// ---------------------------------------------------------------------------

describe('MarkerReplayService state machine', () => {
  let service: MarkerReplayService;
  let mockHttp: any;
  let mockToaster: { error: ReturnType<typeof vi.fn> } & ToasterService;
  let svgFixture: SVGSVGElement;

  /** Route mockHttp.get by URL fragment; each handler receives the URL. */
  function mockRoutes(handlers: { range?: (url: string) => any; frames?: (url: string) => any; detail?: (url: string) => any }) {
    mockHttp.get.mockImplementation((_c: any, url: string) => {
      if (url.includes('/replay/frames')) return handlers.frames ? handlers.frames(url) : of({ frames: [] });
      if (url.includes('/replay/frame/detail')) return handlers.detail ? handlers.detail(url) : of(detailOf(F0));
      return handlers.range ? handlers.range(url) : of(rangeOf([F0, F1, F2]));
    });
  }

  const detailUrls = () => mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('frame/detail')).map((c: any[]) => c[1]);

  /** Minimal svg#map fixture so link-class toggling is observable in jsdom. */
  function buildSvg(links: string[]) {
    svgFixture = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgFixture.id = 'map';
    for (const id of links) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'link'); // matches the service's `g.link[link_id=…]` selector
      g.setAttribute('link_id', id);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'ethernet_link');
      g.appendChild(path);
      svgFixture.appendChild(g);
    }
    document.body.appendChild(svgFixture);
  }

  const linkClass = (id: string) =>
    svgFixture.querySelector(`g.link[link_id="${id}"] path`)!.classList.contains('marker-replay-active');

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn() };
    mockToaster = { error: vi.fn(), warning: vi.fn() } as unknown as {
      error: ReturnType<typeof vi.fn>;
      warning: ReturnType<typeof vi.fn>;
    } & ToasterService;
    service = new MarkerReplayService(mockHttp, mockToaster);
  });

  afterEach(() => {
    service.destroy();
    if (svgFixture) {
      svgFixture.remove();
      svgFixture = undefined as any;
    }
  });

  describe('range load', () => {
    it('loads a full timeline (frames mode) and debounces the first frame detail', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);

      expect(service.loadingRange()).toBe(false);
      expect(service.mode()).toBe('frames');
      expect(service.frames()).toHaveLength(3);
      expect(service.currentFrameIndex()).toBe(0);
      expect(service.isEmpty()).toBe(false);
      expect(service.detail().status).toBe('idle'); // debounce still pending

      await vi.advanceTimersByTimeAsync(200);
      expect(service.detail().status).toBe('ok');
      expect(detailUrls()).toEqual([expect.stringContaining('ts=1788196663.100000')]);
    });

    it('truncated range switches to buckets, settles the first second, then shows its frames', async () => {
      mockRoutes({ range: () => of(truncatedRange), frames: () => of({ frames: [F0, F1] }) });
      service.start(ctrl, PROJECT_ID, TAG);

      expect(service.mode()).toBe('buckets');
      expect(service.inWindow()).toBe(false);

      await vi.advanceTimersByTimeAsync(200); // bucket settle
      expect(service.inWindow()).toBe(true);
      expect(service.frames()).toHaveLength(2);
      const framesUrl = mockHttp.get.mock.calls.find((c: any[]) => c[1].includes('/replay/frames'))![1];
      expect(framesUrl).toContain('ts=1788196663.000000'); // bucket ts verbatim

      await vi.advanceTimersByTimeAsync(200); // detail debounce
      expect(service.detail().status).toBe('ok');
    });

    it('highlights the current frame link and moves the highlight with the frame', async () => {
      buildSvg(['l1', 'l2']);
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);

      expect(linkClass('l1')).toBe(true);
      expect(linkClass('l2')).toBe(false);

      service.setCurrentIndex(1); // F1 lives on l2
      expect(linkClass('l1')).toBe(false);
      expect(linkClass('l2')).toBe(true);
    });

    it('destroy clears the link highlight', async () => {
      buildSvg(['l1', 'l2']);
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect(linkClass('l1')).toBe(true);

      service.destroy();
      expect(linkClass('l1')).toBe(false);
    });

    it('empty capture (start null, 0 frames) reports isEmpty', () => {
      mockRoutes({ range: () => of(rangeOf([])) });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.isEmpty()).toBe(true);
    });

    it('409 maps to a gate error and toasts', () => {
      mockRoutes({ range: () => throwError(() => serverError(409, 'Cannot replay tag 666 while markers are capturing')) });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.rangeError()).toBe('Cannot replay tag 666 while markers are capturing');
      expect(service.rangeErrorKind()).toBe('gate');
      expect(mockToaster.error).toHaveBeenCalledWith('Cannot replay tag 666 while markers are capturing');
    });

    it('404 maps to missing; network errors map to network', () => {
      mockRoutes({ range: () => throwError(() => serverError(404, 'No markers with tag 666 in project')) });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.rangeErrorKind()).toBe('missing');

      const svc2 = new MarkerReplayService(mockHttp, mockToaster);
      mockHttp.get.mockImplementation(() => throwError(() => serverError(0, 'Controller is unreachable')));
      svc2.start(ctrl, PROJECT_ID, TAG);
      expect(svc2.rangeErrorKind()).toBe('network');
      svc2.destroy();
    });
  });

  describe('detail pipeline', () => {
    it('rapid scrubbing issues a single detail request (debounce)', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(1);

      service.setCurrentIndex(1);
      service.setCurrentIndex(2);
      await vi.advanceTimersByTimeAsync(200);

      expect(detailUrls()).toHaveLength(2);
      expect(detailUrls()[1]).toContain('ts=1788196663.300000');
      expect(service.detail().status).toBe('ok');
    });

    it('cancels a stale in-flight decode when the frame changes (switchMap)', async () => {
      const stalled = new Subject<ReplayFrameDetail>();
      let detailCalls = 0;
      mockRoutes({
        detail: () => {
          detailCalls++;
          return detailCalls === 1 ? stalled : of(detailOf(F2));
        },
      });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.detail().status).toBe('loading'); // stalled in flight

      service.setCurrentIndex(2);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.detail().status).toBe('ok');

      // The stalled response arriving late must NOT overwrite the newer frame.
      stalled.next(detailOf(F1));
      expect(service.detail().status).toBe('ok');
      expect((service.detail() as any).detail.tree[0].showname).toContain('Time to Live: 3');
    });

    it('caches by identity tuple — same ts, different link are separate entries', async () => {
      const sameTs = frame('1788196663.100000', 'l2', 1);
      mockRoutes({ range: () => of(rangeOf([F0, sameTs])) });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(1);

      service.setCurrentIndex(1);
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(2); // distinct tuple → fetched

      service.setCurrentIndex(0);
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(2); // cache hit → no refetch
    });

    it('evicts the oldest detail past the 50-entry LRU cap', async () => {
      const many = Array.from({ length: 55 }, (_, i) => frame(`${1000 + i}.000000`, 'l1', i + 1));
      mockRoutes({ range: () => of(rangeOf(many)) });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200); // frame 0
      for (let i = 1; i < many.length; i++) {
        service.setCurrentIndex(i);
        await vi.advanceTimersByTimeAsync(200);
      }
      expect(detailUrls()).toHaveLength(55);

      service.setCurrentIndex(0); // evicted long ago (51 distinct since) → refetch
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(56);
    });

    it('maps detail 501 to unavailable and recovers via retryDetail', async () => {
      let fail = true;
      mockRoutes({
        detail: () =>
          fail
            ? throwError(() => serverError(501, 'tshark is not installed on this server — frame detail is unavailable'))
            : of(detailOf(F0)),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);

      const state = service.detail();
      expect(state.status).toBe('error');
      expect((state as any).kind).toBe('unavailable');
      expect((state as any).frame.ts).toBe(F0.ts);

      fail = false;
      service.retryDetail();
      await vi.advanceTimersByTimeAsync(200);
      expect(service.detail().status).toBe('ok');
    });

    it('maps detail 404 to missing', async () => {
      mockRoutes({ detail: () => throwError(() => serverError(404, 'no frame matches ts')) });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect((service.detail() as any).kind).toBe('missing');
    });
  });

  describe('navigation', () => {
    it('setCurrentIndex clamps and same-index calls do not re-poke', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);

      service.setCurrentIndex(99); // clamps to 2 — a real change, one fetch
      expect(service.currentFrameIndex()).toBe(2);
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(2);

      service.setCurrentIndex(2); // same index — no poke
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(2);

      service.setCurrentIndex(-10); // clamps to 0 — pokes, but frame 0 is LRU-cached
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentFrameIndex()).toBe(0);
      expect(detailUrls()).toHaveLength(2); // cache hit — no refetch
    });

    it('stepBy clamps at timeline ends in frames mode', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.stepBy(-10);
      expect(service.currentFrameIndex()).toBe(0);
      service.stepBy(99);
      expect(service.currentFrameIndex()).toBe(2);
    });

    it('crossing a materialized window edge exits to the adjacent bucket, landing on the nearest end', async () => {
      mockRoutes({
        range: () => of(truncatedRange),
        frames: (url) =>
          url.includes('ts=1788196663.000000')
            ? of({ frames: [F0, F1] })
            : of({ frames: [G0, G1, G2] }),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentFrame()?.ts).toBe(F0.ts); // window of bucket 0

      // Forward past the window's last frame → bucket 1, landing on its FIRST frame.
      service.stepBy(5);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentBucketIndex()).toBe(1);
      expect(service.currentFrame()?.ts).toBe(G0.ts);

      // Backward past the new window's first frame → bucket 0 (cached), landing
      // on its LAST frame (closest in time to where we were).
      service.stepBy(-1);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentBucketIndex()).toBe(0);
      expect(service.currentFrame()?.ts).toBe(F1.ts);

      // Backward at the very start of the timeline stays put.
      service.setCurrentIndex(0);
      service.stepBy(-1);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentBucketIndex()).toBe(0);
      expect(service.currentFrame()?.ts).toBe(F0.ts);
    });
  });

  describe('bookmarks', () => {
    it('toggles the current frame by tuple identity', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);

      expect(service.isBookmarked(service.currentFrame())).toBe(false);
      service.toggleBookmark();
      expect(service.isBookmarked(service.currentFrame())).toBe(true);
      expect(service.bookmarks()).toHaveLength(1);
      service.toggleBookmark();
      expect(service.bookmarks()).toHaveLength(0);
    });

    it('caps bookmarks at 100 (oldest dropped)', () => {
      const many = Array.from({ length: 105 }, (_, i) => frame(`${1000 + i}.000000`, 'l1', i + 1));
      mockRoutes({ range: () => of(rangeOf(many)) });
      service.start(ctrl, PROJECT_ID, TAG);
      for (let i = 0; i < many.length; i++) {
        service.setCurrentIndex(i);
        service.toggleBookmark();
      }
      expect(service.bookmarks()).toHaveLength(100);
      expect(service.bookmarks()[0].ts).toBe(many[5].ts); // frames 0–4 dropped
    });

    it('jumpToBookmark locates the exact frame in frames mode', () => {
      const many = Array.from({ length: 10 }, (_, i) => frame(`${1000 + i}.000000`, 'l1', i + 1));
      mockRoutes({ range: () => of(rangeOf(many)) });
      service.start(ctrl, PROJECT_ID, TAG);
      const target = many[7];
      service.setCurrentIndex(7);
      service.toggleBookmark();
      service.setCurrentIndex(0);

      service.jumpToBookmark(target);
      expect(service.currentFrameIndex()).toBe(7);
    });

    it('jumpToBookmark materializes the containing second first in bucket mode', async () => {
      mockRoutes({
        range: () => of(truncatedRange),
        frames: (url) =>
          url.includes('ts=1788196663.000000')
            ? of({ frames: [F0, F1] })
            : of({ frames: [G0, G1, G2] }),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200); // in bucket 0's window

      service.jumpToBookmark(G1);
      await vi.advanceTimersByTimeAsync(200);
      expect(service.currentBucketIndex()).toBe(1);
      expect(service.currentFrame()?.ts).toBe(G1.ts);
    });
  });

  describe('pinned comparison windows', () => {
    it('pins the current frame and resolves its own detail state', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200); // first-frame decode lands + cached

      service.pinCurrent();
      const pin = service.pinnedDetails()[0];
      expect(pin.frame.ts).toBe(F0.ts);
      // Cached decode (the debounced pipeline fetched it already) → ok
      // synchronously, with NO extra HTTP call.
      expect(pin.state.status).toBe('ok');
      expect(detailUrls()).toHaveLength(1);

      service.unpin(pin.id);
      expect(service.pinnedDetails()).toHaveLength(0);
    });

    it('re-pinning the same frame (tuple identity) is a no-op', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.pinCurrent();
      service.pinCurrent();
      expect(service.pinnedDetails()).toHaveLength(1);
    });

    it('pins decode straight away when the frame was not cached yet', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.setCurrentIndex(2); // F2's decode still debounced/pending
      service.pinCurrent();
      // Immediate fetch path (no debounce) — one request, loading → ok.
      expect(detailUrls()).toHaveLength(1);
      expect(service.pinnedDetails()[0].state.status).toBe('ok');
    });

    it('unpin also drops the window’s snap-registry rect', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.pinCurrent();
      const id = service.pinnedDetails()[0].id;
      service.reportPinRect(id, { left: 10, top: 20, width: 440, height: 320 }, true);
      expect(service.pinSiblingRects(999)).toHaveLength(1);

      service.unpin(id);
      expect(service.pinSiblingRects(999)).toHaveLength(0);
    });

    it('tracks docked vs freed windows (dock row + cluster join sources)', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.pinCurrent(); // frame 0
      service.setCurrentIndex(1);
      service.pinCurrent(); // frame 1
      const [a, b] = service.pinnedDetails();

      service.reportPinRect(a.id, { left: 0, top: 0, width: 440, height: 360 }, true);
      service.reportPinRect(b.id, { left: 500, top: 200, width: 440, height: 360 }, false);

      expect(service.dockedPinIds()).toEqual([a.id]);
      expect(service.freedPinRects()).toEqual([{ left: 500, top: 200, width: 440, height: 360 }]);
      expect(service.pinSiblingRects(a.id)).toEqual([{ left: 500, top: 200, width: 440, height: 360 }]);

      // Rect-only reports do NOT bump the version; docked↔freed flips do.
      const v = service.dockVersion();
      service.reportPinRect(b.id, { left: 501, top: 200, width: 440, height: 360 }, false);
      expect(service.dockVersion()).toBe(v);
      service.reportPinRect(b.id, { left: 501, top: 200, width: 440, height: 360 }, true);
      expect(service.dockVersion()).toBe(v + 1);
      expect(service.dockedPinIds()).toEqual([a.id, b.id]);
    });

    it('remembers the last manual resize for the session', () => {
      expect(service.userWindowSize()).toBeNull();
      service.rememberWindowSize(520, 380);
      expect(service.userWindowSize()).toEqual({ width: 520, height: 380 });
    });

    it('caps pins at 8, dropping the oldest with a warning toast', () => {
      const many = Array.from({ length: 9 }, (_, i) => frame(`${1000 + i}.000000`, 'l1', i + 1));
      mockRoutes({ range: () => of(rangeOf(many)) });
      service.start(ctrl, PROJECT_ID, TAG);
      for (let i = 0; i < many.length; i++) {
        service.setCurrentIndex(i);
        service.pinCurrent();
      }
      expect(service.pinnedDetails()).toHaveLength(8);
      expect(service.pinnedDetails()[0].frame.ts).toBe(many[1].ts); // first pin dropped
      expect(mockToaster.warning).toHaveBeenCalled();
    });

    it('a pinned snapshot survives detail-cache eviction by unrelated decodes', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200);
      service.pinCurrent();
      const pinned = service.pinnedDetails()[0];

      // Scroll through other frames — their decodes fill/evict the LRU cache.
      service.setCurrentIndex(1);
      service.setCurrentIndex(2);
      await vi.advanceTimersByTimeAsync(200);

      expect(service.pinnedDetails()[0]).toBe(pinned); // same entry object…
      expect(service.pinnedDetails()[0].state.status).toBe('ok'); // …tree intact
    });

    it('retryPin re-fires a failed decode', async () => {
      let calls = 0;
      mockRoutes({
        detail: () => {
          calls++;
          // Fetch #1 = the debounced timeline decode, #2 = the pin itself;
          // both fail → the pin lands in error, then the retry succeeds.
          return calls <= 2 ? throwError(() => serverError(501, 'no tshark')) : of(detailOf(F0));
        },
      });
      service.start(ctrl, PROJECT_ID, TAG);
      await vi.advanceTimersByTimeAsync(200); // fetch #1 fails (not cached)
      service.pinCurrent(); // fetch #2 fails
      const pin = service.pinnedDetails()[0];
      expect(pin.state.status).toBe('error');

      service.retryPin(pin.id); // fetch #3 succeeds
      expect(service.pinnedDetails()[0].state.status).toBe('ok');
    });
  });

  describe('teardown', () => {
    it('destroy cancels a pending debounced detail request', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.setCurrentIndex(1); // pokes the debounce
      service.destroy();
      await vi.advanceTimersByTimeAsync(200);
      expect(detailUrls()).toHaveLength(0);
      expect(service.detail().status).toBe('idle');
    });
  });
});
