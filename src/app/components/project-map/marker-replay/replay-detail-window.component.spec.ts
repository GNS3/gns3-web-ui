import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';
import { EventEmitter } from '@angular/core';

import { ReplayDetailWindowComponent } from './replay-detail-window.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import type { ResizeEvent } from 'angular-resizable-element';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Controller } from '@models/controller';
import { PinnedDetail, ReplayFrame, ReplayFrameDetail, ReplayRangeResponse } from '@models/marker-replay';
import { dockSlot, DOCK_GAP } from './replay-geometry';

describe('ReplayDetailWindowComponent (pinned comparison window)', () => {
  let fixture: ComponentFixture<ReplayDetailWindowComponent>;
  let component: ReplayDetailWindowComponent;
  let svc: MarkerReplayService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;
  let svgFixture: SVGSVGElement | null;

  const controller = { id: 1 } as Controller;

  const frames: ReplayFrame[] = [
    { ts: '1788196663.100000', len: 98, node_id: 'n1', link_id: 'l1', marker: 'global-arp', frame_number: 1 },
    { ts: '1788196663.200000', len: 74, node_id: 'n1', link_id: 'l2', marker: 'global-arp', frame_number: 2 },
  ];
  const range: ReplayRangeResponse = {
    tag: 7,
    start: frames[0].ts,
    end: frames[1].ts,
    frame_count: 2,
    truncated: false,
    sources: [],
    frames,
  };
  const detail: ReplayFrameDetail = {
    ts: frames[0].ts,
    source: { node_id: 'n1', link_id: 'l1', marker: 'global-arp', frame_number: 1 },
    field_count: 2,
    hex: 'ab',
    // Mirrors the sharkd decode: a geninfo plumbing proto may precede the
    // real ones — it must not render (insurance guard in protocol-tree).
    tree: [
      {
        element: 'proto',
        name: 'geninfo',
        label: 'General information',
        children: [{ element: 'field', name: 'num', label: 'Number: 1', children: [] }],
      },
      {
        element: 'proto',
        name: 'ip',
        label: 'Internet Protocol Version 4, Src: 10.0.0.1',
        children: [
          { element: 'field', name: 'ip.ttl', label: 'Time to Live: 64', filter_expr: 'ip.ttl == 64', size: '1', pos: '22', children: [] },
        ],
      },
    ],
  };

  /** svg#map with a link group whose path reports a nonzero screen rect. */
  function buildMap(linkId: string) {
    svgFixture = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgFixture.id = 'map';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'link');
    g.setAttribute('link_id', linkId);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'ethernet_link');
    g.appendChild(path);
    svgFixture.appendChild(g);
    document.body.appendChild(svgFixture);
    return path;
  }

  // Per the unit-testing skill: zoneless async tests always run under fake
  // timers (real macrotask awaits starve under the zoneless scheduler here).
  // Fake timers also drive the component's rAF-coalesced reposition passes.
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn().mockReturnValue(of(range)) };

    await TestBed.configureTestingModule({
      imports: [ReplayDetailWindowComponent],
      providers: [
        MarkerReplayService,
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
        // App-module-level in production; plain emitters are all the window needs.
        { provide: MapScaleService, useValue: { scaleChangeEmitter: new EventEmitter() } },
        { provide: MapSettingsService, useValue: { mapRenderedEmitter: new EventEmitter() } },
        { provide: LinksDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
        { provide: NodesDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayDetailWindowComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(MarkerReplayService);
    fixture.componentRef.setInput('zIndex', 1100);
    // `pinned` is REQUIRED — mount a default snapshot before the first render
    // (ngOnInit's reposition reads it synchronously under jsdom).
    svc.pinnedDetails.set([pinOf()]);
    fixture.componentRef.setInput('pinned', pinOf());
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
    if (svgFixture) {
      svgFixture.remove();
      svgFixture = null;
    }
    vi.restoreAllMocks();
  });

  const pinOf = (over: Partial<PinnedDetail> = {}): PinnedDetail => ({
    id: 1,
    frame: frames[0],
    state: { status: 'idle' },
    ...over,
  });

  /** Advance the fake clock past the rAF reposition pass, then re-render. */
  async function flushFrames() {
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
  }

  /** Put the map's l1 link on screen (stubbed rect) and start the service. */
  async function load(linkOnMap = true) {
    if (linkOnMap) {
      const path = buildMap('l1');
      // jsdom rects are 0×0 — stub the path's rect so the anchor resolves.
      vi.spyOn(path, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 500, y: 300, width: 120, height: 2 })
      );
    }
    svc.start(controller, 'p1', 7);
    await flushFrames();
  }

  /** Swap the mounted snapshot (keeps the pinnedDetails list in sync). */
  function mountPin(pin: PinnedDetail, all: PinnedDetail[] = [pin]) {
    svc.pinnedDetails.set(all);
    fixture.componentRef.setInput('pinned', pin);
    fixture.detectChanges();
  }

  describe('chrome + detail pane', () => {
    it('renders the snapshot header and the pane metadata (len/frame#)', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__window')).toBeTruthy();
      expect(el.querySelector('.gns3-replay__meta-chips')).toBeTruthy();
      expect(el.textContent).toContain('98 B');
      expect(el.querySelector('.gns3-replay__window-frame')?.textContent).toContain('#1');
      expect(el.querySelector('.gns3-replay__window--unanchored')).toBeNull();
    });

    it('draws the primary leader line to the link when anchored', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));

      const el: HTMLElement = fixture.nativeElement;
      const svg = el.querySelector<SVGSVGElement>('.gns3-replay__leader');
      expect(svg).toBeTruthy();
      expect(svg!.classList.contains('gns3-replay__leader--pin')).toBe(true);
      const line = svg!.querySelector('line');
      expect(line?.getAttribute('x2')).toBe('560'); // rect center x = 500 + 120/2
      expect(line?.getAttribute('y2')).toBe('301');
    });

    it('falls back to unanchored (no leader) when the link is not on the map', async () => {
      await load(false);
      await flushFrames();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__window--unanchored')).toBeTruthy();
      expect(el.textContent).toContain('unanchored');
      expect(el.querySelector('.gns3-replay__leader')).toBeNull();
    });

    it('renders the decoded tree collapsed, expandable on click, plus crumbs', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));

      const el: HTMLElement = fixture.nativeElement;
      // All collapsed by default: only the protocol row, no fields yet — and
      // the geninfo plumbing proto never shows up.
      expect(el.querySelectorAll('.gns3-replay__tree-row').length).toBe(1);
      expect(el.textContent).toContain('Internet Protocol Version 4');
      expect(el.textContent).not.toContain('Time to Live');
      expect(el.textContent).not.toContain('General information');
      expect(el.querySelector('.gns3-replay__crumb')?.textContent).toBe('IP');

      (el.querySelector('.gns3-replay__tree-row') as HTMLElement).click();
      fixture.detectChanges();
      expect(el.querySelectorAll('.gns3-replay__tree-row').length).toBe(2);
      expect(el.textContent).toContain('Time to Live: 64');
    });

    it('unavailable (sharkd) errors render inline with a Retry that re-fires the PIN decode', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'error', kind: 'unavailable', message: 'sharkd is not installed', frame: frames[0] } }));

      const retry = vi.spyOn(svc, 'retryPin');
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('sharkd');
      const btn = el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!;
      expect(btn.textContent).toContain('Retry');
      btn.click();
      expect(retry).toHaveBeenCalledWith(1);
    });

    it('missing (stale ts) errors offer Close, which unpins the snapshot', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'error', kind: 'missing', message: 'stale', frame: frames[0] } }));

      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!;
      expect(btn.textContent).toContain('Close');
      btn.click();
      expect(svc.pinnedDetails()).toHaveLength(0);
    });

    it('shows the neutral idle hint before any decode has settled', async () => {
      await load();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__detail-state')?.textContent).toContain('No frame decoded yet');
    });

    it('a tree field filter_expr click re-filters the main list (the pin stays frozen)', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));
      const apply = vi.spyOn(svc, 'applyFilter');

      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.gns3-replay__tree-row') as HTMLElement).click(); // expand ip
      fixture.detectChanges();
      (el.querySelector<HTMLButtonElement>('.gns3-replay__tree-filter-btn')!).click();

      expect(apply).toHaveBeenCalledWith('ip.ttl == 64');
    });

    it('the close button unpins the snapshot', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__window-close')!.click();
      expect(svc.pinnedDetails()).toHaveLength(0);
    });

    it('the search bar rides the SHARED query — outside writes highlight, typing publishes', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));

      const el: HTMLElement = fixture.nativeElement;
      // The query typed in ANOTHER window arrives via the shared signal…
      svc.searchQuery.set('time to live');
      await flushFrames();

      // Collapsed ancestors auto-revealed: geninfo never renders, so ip + ttl.
      const hit = el.querySelectorAll('.gns3-replay__tree-row')[1];
      expect(hit.classList.contains('gns3-replay__tree-row--match')).toBe(true);
      expect(el.querySelector<HTMLInputElement>('.gns3-replay__search-input')).toBeTruthy();

      // …and typing HERE publishes back to the shared signal for every window.
      const input = el.querySelector<HTMLInputElement>('.gns3-replay__search-input')!;
      input.value = 'ttl';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      expect(svc.searchQuery()).toBe('ttl');
    });

    it('highlights changed leaves and their collapsed ancestors from changedPaths', async () => {
      await load();
      mountPin(pinOf({ state: { status: 'ok', detail } }));
      fixture.componentRef.setInput('changedPaths', new Set(['ip/ip.ttl']));
      await flushFrames();

      const el: HTMLElement = fixture.nativeElement;
      // Collapsed: the ip protocol row flags "something inside changed"…
      const ipRow = el.querySelector<HTMLElement>('.gns3-replay__tree-row')!;
      expect(ipRow.classList.contains('gns3-replay__tree-row--changed-subtree')).toBe(true);

      // …expanded: the changed leaf itself lights up.
      ipRow.click();
      fixture.detectChanges();
      const leaf = el.querySelectorAll('.gns3-replay__tree-row')[1];
      expect(leaf.classList.contains('gns3-replay__tree-row--changed')).toBe(true);
    });
  });

  describe('drag-resize', () => {
    const ev = (width?: number, height?: number): ResizeEvent =>
      ({ rectangle: { top: 100, left: 100, width, height }, edges: {} }) as ResizeEvent;

    it('rejects resize gestures below the minimum size', () => {
      expect(component.validate(ev(100, 100))).toBe(false);
      expect(component.validate(ev(component.MIN_W - 1, 300))).toBe(false);
      expect(component.validate(ev(400, component.MIN_H - 1))).toBe(false);
      expect(component.validate(ev(400, 300))).toBe(true);
      // One axis untouched (undefined) is fine — only the moved edge is judged.
      expect(component.validate(ev(undefined, 300))).toBe(true);
    });

    it('clamps an under-minimum end event and FREES a docked snapshot', async () => {
      await load();
      expect(component.dragPinned()).toBe(false); // docked

      component.onResizeEnd(ev(100, 100));
      await flushFrames();

      expect(component.winWidth()).toBe(component.MIN_W);
      expect(component.winHeight()).toBe(component.MIN_H);
      expect(component.resizing()).toBe(false);
      expect(component.dragPinned()).toBe(true); // a docked tile's size is the dock's — resizing frees it
    });

    it('accepts a valid end event and remembers the size for later pins', async () => {
      await load();
      component.onResizeEnd(ev(500, 300));
      await flushFrames();
      expect(component.winWidth()).toBe(500);
      expect(component.winHeight()).toBe(300);
      expect(svc.userWindowSize()).toEqual({ width: 500, height: 300 });
    });
  });

  describe('position (dock / freed / cluster)', () => {
    /** Dispatch a header drag gesture: down at (100,100), move by (dx,dy), up. */
    async function dragBy(dx: number, dy: number) {
      const header = (fixture.nativeElement as HTMLElement).querySelector(
        '.gns3-replay__window-header'
      ) as HTMLElement;
      header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      if (dx || dy) document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + dx, clientY: 100 + dy }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      await flushFrames();
    }

    it('dragging the header frees the window at the dropped spot; leader still tracks', async () => {
      await load();
      await flushFrames();
      const left = component.winLeft();
      const top = component.winTop();

      await dragBy(120, 40);

      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(left + 120);
      // The drop is clamped to the viewport bottom (jsdom 768 − 360 tile height).
      expect(component.winTop()).toBe(Math.min(top + 40, window.innerHeight - component.winHeight()));
      expect(component.leader()).not.toBeNull();
      // The leader attaches to whichever window EDGE faces the link anchor
      // (stubbed rect center = 560, 301).
      const center = component.winLeft() + component.winWidth() / 2;
      const expectedEdge = 560 < center ? component.winLeft() : component.winLeft() + component.winWidth();
      expect(component.leader()!.x1).toBe(expectedEdge);
    });

    it('a header click without movement does not free the window', async () => {
      await load();
      await flushFrames();
      await dragBy(0, 0);
      expect(component.dragPinned()).toBe(false);
    });

    it('map zoom does not move a freed window', async () => {
      await load();
      await flushFrames();
      await dragBy(120, 40);
      const left = component.winLeft();

      TestBed.inject(MapScaleService).scaleChangeEmitter.emit();
      await flushFrames();

      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(left);
      expect(component.leader()).not.toBeNull();
    });

    it('the re-anchor button returns a freed window to the dock row', async () => {
      await load();
      await flushFrames();
      await dragBy(120, 40);
      const freedLeft = component.winLeft();

      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '.gns3-replay__window-reanchor:not(.gns3-replay__window-close)'
      );
      expect(btn).toBeTruthy();
      btn!.click();
      await flushFrames();

      expect(component.dragPinned()).toBe(false);
      const slot = dockSlot(0, 1, { width: window.innerWidth, height: window.innerHeight });
      expect(component.winLeft()).toBe(slot.left);
      expect(component.winTop()).toBe(slot.top);
      expect(freedLeft).not.toBe(slot.left);
    });

    it('docks at the bottom-left comparison slot matching its index among the pins', async () => {
      await load();
      const pins = [
        { id: 1, frame: frames[0], state: { status: 'ok', detail } as const },
        { id: 2, frame: frames[1], state: { status: 'ok', detail } as const },
      ];
      mountPin(pins[1], pins);
      await flushFrames();

      const slot = dockSlot(1, 2, { width: window.innerWidth, height: window.innerHeight });
      expect(component.winLeft()).toBe(slot.left);
      expect(component.winTop()).toBe(slot.top);
      expect(component.winWidth()).toBe(slot.width);
      expect(component.winHeight()).toBe(slot.height);

      // Unpinning the first shifts this one's index → it reflows to slot 0.
      svc.pinnedDetails.set([pins[1]]);
      fixture.detectChanges();
      await flushFrames();
      expect(component.winLeft()).toBe(dockSlot(0, 1, { width: window.innerWidth, height: window.innerHeight }).left);
    });

    it('a manual resize becomes the dock tile size for later pins', async () => {
      await load();
      component.onResizeEnd({ rectangle: { top: 0, left: 0, width: 520, height: 380 }, edges: {} } as any);
      await flushFrames();
      expect(svc.userWindowSize()).toEqual({ width: 520, height: 380 });
      component.reanchor(); // back to the dock — at the remembered size
      await flushFrames();

      const slot = dockSlot(0, 1, { width: window.innerWidth, height: window.innerHeight }, { width: 520, height: 380 });
      expect(component.winWidth()).toBe(slot.width); // 520 — remembered, not 440
      expect(component.winHeight()).toBe(slot.height); // 380
      expect(component.winLeft()).toBe(slot.left);
    });

    it('dragging a snapshot magnetically snaps against a settled sibling', async () => {
      await load();
      await flushFrames();
      const startLeft = component.winLeft();
      const startTop = component.winTop();
      expect(startLeft).toBe(16); // dock slot bottom-left in jsdom 1024×768

      // A settled sibling nowhere near the dock slot.
      svc.reportPinRect(2, { left: 300, top: 200, width: 440, height: 320 }, true);

      // Drag toward it: raw (start + 294, start − 229) = (310, ~top-229) —
      // within the 12px snap threshold of the sibling's (300, 200).
      const header = (fixture.nativeElement as HTMLElement).querySelector('.gns3-replay__window-header') as HTMLElement;
      header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + 294, clientY: 100 + (200 - startTop) + 3 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      await flushFrames();

      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(300); // snapped flush/aligned
      expect(component.winTop()).toBe(200);
    });

    it('a snapshot whose link left the map shows the unanchored degradation', async () => {
      await load();
      await flushFrames();

      svgFixture!.remove(); // the map (and this pin's link) disappears
      svgFixture = null;
      component.reanchor();
      await flushFrames();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__window--unanchored')).toBeTruthy();
      expect(el.querySelector('.gns3-replay__leader')).toBeNull();
      expect(el.textContent).toContain('unanchored');
    });

    it('a NEW pin joins the hand-arranged cluster flush beside it (not the dock)', async () => {
      await load();
      await flushFrames();

      // Pin #1 docks, then the user drags it out to (100, 200) — hand-arranged.
      const header = (fixture.nativeElement as HTMLElement).querySelector('.gns3-replay__window-header') as HTMLElement;
      header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + 84, clientY: 100 - 232 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      await flushFrames();
      const arrangedLeft = component.winLeft();
      const arrangedTop = component.winTop();
      expect(component.dragPinned()).toBe(true);
      expect(svc.freedPinRects()).toHaveLength(1);

      // Pin #2 arrives (simulate its FRESH window: not yet placed, not dragged).
      const pin2 = { id: 2, frame: frames[1], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([svc.pinnedDetails()[0], pin2]);
      (component as any)['placed'] = false;
      component.dragPinned.set(false);
      fixture.componentRef.setInput('pinned', pin2);
      await flushFrames();

      // Joined the cluster: one SEAM (DOCK_GAP) right of pin #1 (440 wide),
      // top-aligned, freed (part of the arrangement) rather than docked at the
      // bottom row. The seam keeps both windows' resize handles off each
      // other's scrollbars.
      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(arrangedLeft + 440 + DOCK_GAP);
      expect(component.winTop()).toBe(arrangedTop);
      expect(svc.dockedPinIds()).toEqual([]); // both windows live in the cluster
    });
  });
});
