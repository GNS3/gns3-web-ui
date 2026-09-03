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
import { ReplayFrame, ReplayFrameDetail, ReplayRangeResponse } from '@models/marker-replay';
import { DOCK_GAP, dockSlot } from './replay-geometry';

describe('ReplayDetailWindowComponent', () => {
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
    tshark_version: 'TShark 4.6.7',
    field_count: 2,
    hex: 'ab',
    // Mirrors real tshark PDML: a geninfo plumbing proto first, and
    // hide="yes" filter-only combination fields (ip.addr/ip.host) among the
    // real ones — neither may render.
    tree: [
      {
        element: 'proto',
        name: 'geninfo',
        showname: 'General information',
        children: [{ element: 'field', name: 'num', showname: 'Number', show: '1', children: [] }],
      },
      {
        element: 'proto',
        name: 'ip',
        showname: 'Internet Protocol Version 4, Src: 10.0.0.1',
        children: [
          { element: 'field', name: 'ip.ttl', showname: 'Time to Live: 64', show: '64', value: '40', size: '1', pos: '22', children: [] },
          { element: 'field', name: 'ip.addr', showname: 'Source or Destination Address: 10.0.0.1', hide: 'yes', children: [] },
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
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
    if (svgFixture) {
      svgFixture.remove();
      svgFixture = null;
    }
    vi.restoreAllMocks();
  });

  /** Advance the fake clock past the rAF reposition pass, then re-render. */
  async function flushFrames() {
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
  }

  async function load(linkOnMap = true) {
    if (linkOnMap) {
      const path = buildMap('l1');
      // jsdom rects are 0×0 — stub the path's rect so the anchor resolves.
      vi.spyOn(path, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 500, y: 300, width: 120, height: 2 })
      );
    }
    svc.start(controller, 'p1', 7);
    fixture.detectChanges();
    await flushFrames();
  }

  it('renders metadata for the current frame (time/len/frame#)', async () => {
    await load();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__window')).toBeTruthy();
    // Compact chip line (was a 4-row key/value grid) + frame # in the header.
    expect(el.querySelector('.gns3-replay__meta-chips')).toBeTruthy();
    expect(el.textContent).toContain('98 B');
    expect(el.querySelector('.gns3-replay__window-frame')?.textContent).toContain('#1');
    expect(el.querySelector('.gns3-replay__window--unanchored')).toBeNull();
  });

  it('draws the leader line to the link when anchored', async () => {
    await load();
    const el: HTMLElement = fixture.nativeElement;
    const svg = el.querySelector<SVGSVGElement>('.gns3-replay__leader');
    expect(svg).toBeTruthy();
    const line = svg!.querySelector('line');
    expect(line?.getAttribute('x2')).toBe('560'); // rect center x = 500 + 120/2
    expect(line?.getAttribute('y2')).toBe('301');
  });

  it('falls back to unanchored (no leader) when the link is not on the map', async () => {
    load(false);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__window--unanchored')).toBeTruthy();
    expect(el.textContent).toContain('unanchored');
    expect(el.querySelector('.gns3-replay__leader')).toBeNull();
  });

  it('renders the decoded protocol tree collapsed, expandable on click, plus crumbs', async () => {
    await load();
    svc.detail.set({ status: 'ok', detail });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    // All collapsed by default: only the protocol row, no fields yet — and
    // neither geninfo nor the hidden combination field ever shows up.
    expect(el.querySelectorAll('.gns3-replay__tree-row').length).toBe(1);
    expect(el.textContent).toContain('Internet Protocol Version 4');
    expect(el.textContent).not.toContain('Time to Live');
    expect(el.textContent).not.toContain('General information');
    expect(el.querySelector('.gns3-replay__crumb')?.textContent).toBe('IP');

    (el.querySelector('.gns3-replay__tree-row') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.gns3-replay__tree-row').length).toBe(2);
    expect(el.textContent).toContain('Time to Live: 64');
    expect(el.textContent).not.toContain('Source or Destination');
  });

  it('unavailable (tshark) errors render inline with a Retry that re-fires the pipeline', async () => {
    await load();
    const retry = vi.spyOn(svc, 'retryDetail');
    svc.detail.set({ status: 'error', kind: 'unavailable', message: 'tshark is not installed', frame: frames[0] });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('tshark');
    const btn = el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!;
    expect(btn.textContent).toContain('Retry');
    btn.click();
    expect(retry).toHaveBeenCalled();
  });

  it('missing (stale ts) errors offer a timeline reload', async () => {
    await load();
    const reload = vi.spyOn(svc, 'reloadTimeline');
    svc.detail.set({ status: 'error', kind: 'missing', message: 'no frame matches ts', frame: frames[0] });
    fixture.detectChanges();

    const el2: HTMLElement = fixture.nativeElement;
    const btn = el2.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!;
    expect(btn.textContent).toContain('Reload timeline');
    btn.click();
    expect(reload).toHaveBeenCalled();
  });

  it('shows the idle hint before any decode has settled', async () => {
    await load();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__detail-state')?.textContent).toContain('settle on a frame');
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

    it('clamps an under-minimum end event and re-places the window with the new size', async () => {
      await load();
      // Default 440px window flips LEFT of the anchor (jsdom viewport 1024);
      // after clamping to 320px it fits on the RIGHT side — proves placement
      // consumed the resized dimensions.
      const before = component.winLeft();

      component.onResizeEnd(ev(100, 100));
      await flushFrames();

      expect(component.winWidth()).toBe(component.MIN_W);
      expect(component.winHeight()).toBe(component.MIN_H);
      expect(component.resizing()).toBe(false);
      expect(component.winLeft()).toBeGreaterThan(before);
    });

    it('accepts a valid end event as-is', async () => {
      await load();
      component.onResizeEnd(ev(500, 300));
      await flushFrames();
      expect(component.winWidth()).toBe(500);
      expect(component.winHeight()).toBe(300);
    });
  });

  describe('drag-to-pin position', () => {
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

    it('dragging the header pins the window at the dropped spot; leader still tracks', async () => {
      await load();
      const left = component.winLeft();
      const top = component.winTop();

      await dragBy(120, 40);

      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(left + 120);
      expect(component.winTop()).toBe(top + 40);
      expect(component.leader()).not.toBeNull();
      // Leader attaches to the edge facing the link (window now left of it).
      expect(component.leader()!.x1).toBe(component.winLeft() + component.winWidth());
    });

    it('a header click without movement does not pin', async () => {
      await load();
      await dragBy(0, 0);
      expect(component.dragPinned()).toBe(false);
    });

    it('map zoom does not move a pinned window (it would re-place an unpinned one)', async () => {
      await load();
      await dragBy(120, 40);
      const left = component.winLeft();

      TestBed.inject(MapScaleService).scaleChangeEmitter.emit();
      await flushFrames();

      expect(component.dragPinned()).toBe(true);
      expect(component.winLeft()).toBe(left);
      expect(component.leader()).not.toBeNull();
    });

    it('the re-anchor button releases the pin and re-places beside the link', async () => {
      await load();
      await dragBy(120, 40);
      const pinnedLeft = component.winLeft();

      // Two header buttons share the base class — the 📌 pin comes first in
      // DOM order; the re-anchor one is selected explicitly.
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '.gns3-replay__window-reanchor:not(.gns3-replay__window-pin):not(.gns3-replay__window-close)'
      );
      expect(btn).toBeTruthy();
      btn!.click();
      await flushFrames();

      expect(component.dragPinned()).toBe(false);
      // placeWindow for this fixture flips left of the anchor (560) at 440px wide.
      expect(component.winLeft()).not.toBe(pinnedLeft);
      expect(component.winLeft()).toBe(560 - 28 - component.winWidth());
    });
  });

  describe('pinned comparison window', () => {
    it('the live window pins the current frame via the 📌 button', async () => {
      await load();
      await flushFrames(); // first-frame decode lands in the cache
      const pin = vi.spyOn(svc, 'pinCurrent');

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__window-pin')!.click();
      expect(pin).toHaveBeenCalled();
      expect(svc.pinnedDetails()).toHaveLength(1);
      expect(svc.pinnedDetails()[0].frame.ts).toBe(frames[0].ts);
      expect(svc.pinnedDetails()[0].state.status).toBe('ok'); // cache reuse
    });

    it('renders its frozen frame + own state with a close button, and ignores the cursor', async () => {
      await load();
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();
      await flushFrames();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__window-close')).toBeTruthy();
      expect(el.querySelector('.gns3-replay__window-pin')).toBeNull();
      expect(el.querySelector('.gns3-replay__window-frame')?.textContent).toContain('#1');
      expect(el.querySelector('.gns3-replay__window-icon')?.textContent).toContain('push_pin');
      // Snapshot chrome: primary-border modifier, and a PRIMARY leader line to
      // its link — the persistent window→hop association while docked.
      expect(el.querySelector('.gns3-replay__window--snapshot')).toBeTruthy();
      expect(el.querySelector('.gns3-replay__leader--pin')).toBeTruthy();

      // The cursor moves to l2's frame — the pinned window must NOT follow
      // (neither content nor re-anchoring: l2 has no link group on the map).
      const left = component.winLeft();
      svc.setCurrentIndex(1);
      fixture.detectChanges();
      await flushFrames();
      expect(el.querySelector('.gns3-replay__window-frame')?.textContent).toContain('#1');
      expect(component.winLeft()).toBe(left);
    });

    it('docks at the bottom-left comparison slot matching its index among the pins', async () => {
      await load();
      const pins = [
        { id: 1, frame: frames[0], state: { status: 'ok', detail } as const },
        { id: 2, frame: frames[1], state: { status: 'ok', detail } as const },
      ];
      svc.pinnedDetails.set(pins);
      fixture.componentRef.setInput('pinned', pins[1]); // the SECOND pin
      fixture.detectChanges();
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

    it('resizing a docked snapshot frees it; re-anchor returns it to the dock', async () => {
      await load();
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();
      await flushFrames();
      expect(component.dragPinned()).toBe(false); // docked

      const ev = { rectangle: { top: 0, left: 0, width: 500, height: 400 }, edges: {} } as any;
      component.onResizeEnd(ev);
      await flushFrames();
      // The dock owns size while docked — a resize detaches the window and
      // keeps the user's dimensions.
      expect(component.dragPinned()).toBe(true);
      expect(component.winWidth()).toBe(500);
      expect(component.winHeight()).toBe(400);

      component.reanchor();
      await flushFrames();
      expect(component.dragPinned()).toBe(false);
      // The resize was REMEMBERED — re-docking returns at the user's size,
      // not the default tile.
      const slot = dockSlot(0, 1, { width: window.innerWidth, height: window.innerHeight }, { width: 500, height: 400 });
      expect(component.winWidth()).toBe(slot.width);
      expect(component.winHeight()).toBe(slot.height);
      expect(component.winLeft()).toBe(slot.left);
    });

    it('a manual resize becomes the dock size for later pins', async () => {
      await load();
      // The user resizes the LIVE window to their preferred comparison size.
      component.onResizeEnd({ rectangle: { top: 0, left: 0, width: 520, height: 380 }, edges: {} } as any);
      await flushFrames();
      expect(svc.userWindowSize()).toEqual({ width: 520, height: 380 });

      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();
      await flushFrames();

      const slot = dockSlot(0, 1, { width: window.innerWidth, height: window.innerHeight }, { width: 520, height: 380 });
      expect(component.winWidth()).toBe(slot.width); // 520 — remembered, not 440
      expect(component.winHeight()).toBe(slot.height); // 380
    });

    it('dragging a snapshot magnetically snaps against a settled sibling', async () => {
      await load();
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();
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
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();
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
      // Pin #1 docks, then the user drags it out to (100, 200) — hand-arranged.
      const pin1 = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin1]);
      fixture.componentRef.setInput('pinned', pin1);
      fixture.detectChanges();
      await flushFrames();

      const header = (fixture.nativeElement as HTMLElement).querySelector('.gns3-replay__window-header') as HTMLElement;
      header.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + 84, clientY: 100 - 232 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      await flushFrames();
      // jsdom dock slot is (16, 392) → dragged by (84, −232) lands at (100, 160).
      const arrangedLeft = component.winLeft();
      const arrangedTop = component.winTop();
      expect(component.dragPinned()).toBe(true);
      expect(svc.freedPinRects()).toHaveLength(1);

      // Pin #2 arrives (simulate its FRESH window: not yet placed, not dragged).
      const pin2 = { id: 2, frame: frames[1], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin1, pin2]);
      (component as any)['placed'] = false;
      component.dragPinned.set(false);
      fixture.componentRef.setInput('pinned', pin2);
      fixture.detectChanges();
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

    it('the close button unpins the snapshot', async () => {
      await load();
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__window-close')!.click();
      expect(svc.pinnedDetails()).toHaveLength(0);
    });

    it('highlights changed leaves and their collapsed ancestors from changedPaths', async () => {
      await load();
      const pin = { id: 1, frame: frames[0], state: { status: 'ok', detail } as const };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.componentRef.setInput('changedPaths', new Set(['ip/ip.ttl']));
      fixture.detectChanges();
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

    it('the search bar rides the SHARED query — outside writes highlight, typing publishes', async () => {
      await load();
      svc.detail.set({ status: 'ok', detail });
      fixture.detectChanges();

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

    it("a pinned window's failed decode retries through the pin, not the live pipeline", async () => {
      await load();
      const pin = {
        id: 1,
        frame: frames[0],
        state: { status: 'error', kind: 'unavailable', message: 'no tshark', frame: frames[0] } as const,
      };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();

      const retry = vi.spyOn(svc, 'retryPin');
      const liveRetry = vi.spyOn(svc, 'retryDetail');
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '.gns3-replay__detail-error button'
      )!;
      expect(btn.textContent).toContain('Retry');
      btn.click();
      expect(retry).toHaveBeenCalledWith(1);
      expect(liveRetry).not.toHaveBeenCalled();
    });

    it("a pinned window's stale frame (404) offers Close instead of a timeline reload", async () => {
      await load();
      const pin = {
        id: 1,
        frame: frames[0],
        state: { status: 'error', kind: 'missing', message: 'stale', frame: frames[0] } as const,
      };
      svc.pinnedDetails.set([pin]);
      fixture.componentRef.setInput('pinned', pin);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!;
      expect(btn.textContent).toContain('Close');
      btn.click();
      expect(svc.pinnedDetails()).toHaveLength(0);
    });
  });
});
