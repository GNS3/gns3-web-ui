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
    sources: [],
    frames,
    ...over,
  };
}

function detailOf(f: ReplayFrame): ReplayFrameDetail {
  return {
    ts: f.ts,
    source: { node_id: f.node_id, link_id: f.link_id, marker: f.marker, frame_number: f.frame_number },
    field_count: 1,
    hex: 'ab',
    tree: [
      { element: 'field', name: 'ip.ttl', label: `Time to Live: ${f.frame_number}`, filter_expr: 'ip.ttl == 64', size: '1', pos: '22', children: [] },
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

    it('appends an encoded ?filter= query when one is given (never URLSearchParams "+")', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.replayRange(mockController, PROJECT_ID, TAG, 'ospf.msg == 1').subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/range?filter=ospf.msg%20%3D%3D%201`
      );
    });

    it('appends ?link= alone, and &link= after a filter (AND narrowing)', () => {
      mockHttpController.get.mockReturnValue(of({}));
      service.replayRange(mockController, PROJECT_ID, TAG, undefined, 'l1').subscribe();
      expect(mockHttpController.get).toHaveBeenCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/range?link=l1`
      );
      service.replayRange(mockController, PROJECT_ID, TAG, 'ospf', 'l1').subscribe();
      expect(mockHttpController.get).toHaveBeenLastCalledWith(
        mockController,
        `/projects/${PROJECT_ID}/markers/tags/${TAG}/replay/range?filter=ospf&link=l1`
      );
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
      const err = serverError(501, 'sharkd is not installed…');
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
  function mockRoutes(handlers: { range?: (url: string) => any; detail?: (url: string) => any }) {
    mockHttp.get.mockImplementation((_c: any, url: string) => {
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
    it('loads a full timeline (flat frames mode) and debounces the first frame detail', async () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);

      expect(service.loadingRange()).toBe(false);
      expect(service.frames()).toHaveLength(3);
      expect(service.currentFrameIndex()).toBe(0);
      expect(service.isEmpty()).toBe(false);
      expect(service.detail().status).toBe('idle'); // debounce still pending

      await vi.advanceTimersByTimeAsync(200);
      expect(service.detail().status).toBe('ok');
      expect(detailUrls()).toEqual([expect.stringContaining('ts=1788196663.100000')]);
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

  describe('range load races', () => {
    it('a slower OLDER range response cannot overwrite a newer load (load epoch)', () => {
      const slow = new Subject<ReplayRangeResponse>();
      let n = 0;
      mockRoutes({ range: () => (n++ === 0 ? slow : of(rangeOf([G0, G1, G2]))) });
      service.start(ctrl, PROJECT_ID, TAG); // load #1 (unfiltered) stalls on the network
      service.applyFilter('ospf'); // load #2 (filtered) completes first, renders
      expect(service.appliedFilter()).toBe('ospf');
      expect(service.frames()).toHaveLength(3);
      expect(service.frames()[0].ts).toBe(G0.ts);

      slow.next(rangeOf([F0, F1, F2])); // the stale unfiltered reply finally lands
      expect(service.appliedFilter()).toBe('ospf'); // NOT reset to the older load's ''
      expect(service.frames()[0].ts).toBe(G0.ts);
      expect(service.loadingRange()).toBe(false);
    });

    it('a stale range ERROR is equally discarded (no error state, no toast)', () => {
      const slow = new Subject<ReplayRangeResponse>();
      let n = 0;
      mockRoutes({ range: () => (n++ === 0 ? slow : of(rangeOf([G0]))) });
      service.start(ctrl, PROJECT_ID, TAG);
      service.applyFilter('ospf');
      slow.error(serverError(0, 'Controller is unreachable'));
      expect(service.rangeError()).toBeNull();
      expect(mockToaster.error).not.toHaveBeenCalled();
      expect(service.loadingRange()).toBe(false);
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
      expect((service.detail() as any).detail.tree[0].label).toContain('Time to Live: 3');
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
            ? throwError(() => serverError(501, 'sharkd is not installed on this server — frame detail is unavailable'))
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

  });

  describe('display filter', () => {
    it('applyFilter reloads with the encoded filter; matched/total counts split', () => {
      mockRoutes({
        range: (url) => of(url.includes('filter=') ? rangeOf([F2], { frame_count: 1 }) : rangeOf([F0, F1, F2])),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.totalUnfiltered()).toBe(3);

      service.applyFilter('ip.ttl == 1');
      expect(service.appliedFilter()).toBe('ip.ttl == 1');
      expect(service.filterError()).toBeNull();
      expect(service.totalFrames()).toBe(1);
      expect(service.frames()).toHaveLength(1);
      const url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(url).toContain(`filter=${encodeURIComponent('ip.ttl == 1')}`);
      expect(service.totalUnfiltered()).toBe(3); // unfiltered total retained for "of N"
    });

    it('a rejected filter (400) stays INLINE: no toast, old list kept, appliedFilter unchanged', () => {
      let filtered = false;
      mockRoutes({
        range: (url) =>
          url.includes('filter=') && !filtered
            ? throwError(() => serverError(400, 'Invalid display filter: Filter expression invalid'))
            : of(rangeOf([F0, F1, F2])),
      });
      filtered = false;
      service.start(ctrl, PROJECT_ID, TAG);

      service.applyFilter('this is (not valid');
      expect(service.filterError()).toBe('Invalid display filter: Filter expression invalid');
      expect(service.rangeError()).toBeNull();
      expect(mockToaster.error).not.toHaveBeenCalled();
      expect(service.frames()).toHaveLength(3); // last good data kept
      expect(service.appliedFilter()).toBe('');
      expect(service.filter()).toBe('this is (not valid'); // draft kept editable
    });

    it('clearFilter reloads the full list and resets the draft', () => {
      mockRoutes({
        range: (url) => of(url.includes('filter=') ? rangeOf([F2], { frame_count: 1 }) : rangeOf([F0, F1, F2])),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      service.applyFilter('ip.ttl == 1');
      expect(service.appliedFilter()).toBe('ip.ttl == 1');

      service.clearFilter();
      expect(service.filter()).toBe('');
      expect(service.appliedFilter()).toBe('');
      expect(service.frames()).toHaveLength(3);

      // Draft-only clear (nothing applied): the draft alone never narrowed the
      // list — no reload fires.
      service.filter.set('draft');
      const before = mockHttp.get.mock.calls.length;
      service.clearFilter();
      expect(mockHttp.get.mock.calls.length).toBe(before);
      expect(service.filter()).toBe('');
    });

    it('re-applying the SAME filter is a no-op — zero requests (guard mirrors applyLinkFilter)', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.applyFilter('ospf');
      const rangeCalls = () => mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).length;
      const calls = rangeCalls();
      service.applyFilter('ospf');
      expect(rangeCalls()).toBe(calls);
      expect(service.appliedFilter()).toBe('ospf');
    });

    it('filters over 2000 characters are rejected client-side (zero requests)', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      const callsBefore = mockHttp.get.mock.calls.length;

      service.applyFilter('a'.repeat(2001));
      expect(service.filterError()).toContain('2000');
      expect(mockHttp.get.mock.calls.length).toBe(callsBefore);
    });

    it('501 on range maps to unavailable (sharkd missing)', () => {
      mockRoutes({ range: () => throwError(() => serverError(501, 'sharkd not installed')) });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.rangeErrorKind()).toBe('unavailable');
      expect(mockToaster.error).toHaveBeenCalled();
    });
  });

  describe('link filter', () => {
    it('applyLinkFilter reloads narrowed to the link; counts split, sources recorded', () => {
      const sources = [
        { node_id: 'n1', link_id: 'l1', marker: 'm1', count: 2 },
        { node_id: 'n2', link_id: 'l2', marker: 'm2', count: 1 },
      ];
      mockRoutes({
        range: (url) =>
          of(
            url.includes('link=l1')
              ? rangeOf([F0, F2], { frame_count: 2, sources })
              : rangeOf([F0, F1, F2], { sources })
          ),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.totalUnfiltered()).toBe(3);
      expect(service.sources()).toHaveLength(2);

      service.applyLinkFilter('l1');
      expect(service.appliedLink()).toBe('l1');
      expect(service.frames()).toHaveLength(2);
      expect(service.totalFrames()).toBe(2);
      expect(service.totalUnfiltered()).toBe(3); // retained for "of N"
      // The picker keeps its options: sources stay the FULL inventory.
      expect(service.sources()).toHaveLength(2);
      const url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(url).toContain('link=l1');
    });

    it('re-applying the SAME link clears it (chip toggle); null is a no-op when idle', () => {
      mockRoutes({
        range: (url) => of(url.includes('link=l1') ? rangeOf([F0, F2], { frame_count: 2 }) : rangeOf([F0, F1, F2])),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      const rangeCalls = () => mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).length;

      const before = rangeCalls();
      service.applyLinkFilter(null); // already unfiltered — zero requests
      expect(rangeCalls()).toBe(before);

      service.applyLinkFilter('l1');
      service.applyLinkFilter('l1'); // toggle off
      expect(service.appliedLink()).toBeNull();
      expect(service.frames()).toHaveLength(3);
      const lastUrl = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(lastUrl).not.toContain('link=');
    });

    it('composes with the display filter: applyFilter/clearFilter keep the link, clearAllFilters drops both', () => {
      mockRoutes({
        range: (url) => {
          const narrow = url.includes('link=l1') && url.includes('filter=');
          const linkOnly = url.includes('link=l1');
          if (narrow) return of(rangeOf([F2], { frame_count: 1 }));
          if (linkOnly) return of(rangeOf([F0, F2], { frame_count: 2 }));
          return of(rangeOf([F0, F1, F2]));
        },
      });
      service.start(ctrl, PROJECT_ID, TAG);
      service.applyLinkFilter('l1');

      service.applyFilter('ip.ttl == 3');
      let url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(url).toContain('link=l1');
      expect(url).toContain(`filter=${encodeURIComponent('ip.ttl == 3')}`);

      service.clearFilter(); // display-filter ✕ keeps the link pick
      url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(url).toContain('link=l1');
      expect(url).not.toContain('filter=');
      expect(service.appliedLink()).toBe('l1');

      service.applyFilter('ip.ttl == 3');
      service.clearAllFilters(); // empty-result recovery drops BOTH
      url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()![1];
      expect(url).not.toContain('link=');
      expect(url).not.toContain('filter=');
      expect(service.appliedLink()).toBeNull();
      expect(service.appliedFilter()).toBe('');
    });

    it('an unknown link answers 200 EMPTY (not an error) — the empty-filtered state follows', () => {
      mockRoutes({
        range: (url) =>
          of(
            url.includes('link=gone')
              ? rangeOf([], { frame_count: 0, start: null, end: null })
              : rangeOf([F0])
          ),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      service.applyLinkFilter('gone');
      expect(service.rangeError()).toBeNull();
      expect(service.appliedLink()).toBe('gone');
      expect(service.isEmpty()).toBe(true);
    });

    it('a link-only load refreshes totalUnfiltered from the full-inventory sources', () => {
      const src = (n: number) => [{ node_id: 'n1', link_id: 'l1', marker: 'm', count: n }];
      mockRoutes({
        range: (url) =>
          of(
            url.includes('link=l1')
              ? rangeOf([F0], { frame_count: 1, sources: src(500) })
              : rangeOf([F0, F1, F2], { frame_count: 100, sources: src(100) })
          ),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      expect(service.totalUnfiltered()).toBe(100);

      service.applyLinkFilter('l1');
      // frame_count is the narrowed 1 — sources always carry the FULL totals,
      // so "of N"/"All links (N)" stay accurate after link-only reloads.
      expect(service.totalUnfiltered()).toBe(500);
    });
  });

  describe('peek window (transient double-click detail)', () => {
    it('opens with the decode state, decodes through the shared cache, closes', () => {
      mockRoutes({});
      service.start(ctrl, PROJECT_ID, TAG);
      service.openPeek(F1, { x: 10, y: 20 });
      expect(service.peek()?.frame.ts).toBe(F1.ts);
      expect(service.peek()?.at).toEqual({ x: 10, y: 20 });
      expect(service.peek()?.detail.status).toBe('ok'); // immediate (no debounce)

      service.closePeek();
      expect(service.peek()).toBeNull();
    });

    it('a late decode for an abandoned peek is discarded (retarget race)', () => {
      const stalled = new Subject<ReplayFrameDetail>();
      let n = 0;
      mockRoutes({ detail: () => (n++ === 0 ? stalled : of(detailOf(F0))) });
      service.start(ctrl, PROJECT_ID, TAG);
      service.openPeek(F0, { x: 0, y: 0 }); // stalls in flight
      service.openPeek(F1, { x: 9, y: 9 }); // retargets
      stalled.next(detailOf(F0)); // the abandoned frame's decode lands late

      expect(service.peek()?.frame.ts).toBe(F1.ts); // NOT overwritten
      expect(service.peek()?.detail.status).toBe('ok');
    });

    it('retryPeek re-fires a failed decode', () => {
      let fail = true;
      mockRoutes({
        detail: () => (fail ? throwError(() => serverError(501, 'no sharkd')) : of(detailOf(F0))),
      });
      service.start(ctrl, PROJECT_ID, TAG);
      service.openPeek(F0, { x: 0, y: 0 });
      expect(service.peek()?.detail.status).toBe('error');

      fail = false;
      service.retryPeek();
      expect(service.peek()?.detail.status).toBe('ok');
      expect(service.peek()?.at).toEqual({ x: 0, y: 0 }); // same birth spot
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
          return calls <= 2 ? throwError(() => serverError(501, 'no sharkd')) : of(detailOf(F0));
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
