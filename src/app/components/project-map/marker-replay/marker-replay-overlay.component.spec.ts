import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { MarkerReplayOverlayComponent } from './marker-replay-overlay.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { MapScaleService } from '@services/mapScale.service';
import { MapSettingsService } from '@services/mapsettings.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { EventEmitter } from '@angular/core';
import { Controller } from '@models/controller';
import { Project } from '@models/project';
import { ReplayFrame, ReplayFrameDetail, ReplayRangeResponse } from '@models/marker-replay';

describe('MarkerReplayOverlayComponent', () => {
  let fixture: ComponentFixture<MarkerReplayOverlayComponent>;
  let component: MarkerReplayOverlayComponent;
  let svc: MarkerReplayService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;

  const controller = { id: 1 } as Controller;
  const project = { project_id: 'p1' } as Project;

  const frames: ReplayFrame[] = [
    {
      ts: '1.100000', len: 60, node_id: 'n1', link_id: 'l1', marker: 'm', frame_number: 1,
      src: '10.0.12.1', dst: '224.0.0.5', proto: 'OSPF', info: 'Hello Packet',
      bg: 'fff3d6', fg: '12272e',
    },
    {
      ts: '1.200000', len: 70, node_id: 'n1', link_id: 'l2', marker: 'm', frame_number: 2,
      src: '10.0.12.2', dst: '224.0.0.5', proto: 'OSPF', info: 'Hello Packet',
      bg: 'fff3d6', fg: '12272e',
    },
  ];
  const range: ReplayRangeResponse = {
    tag: 7,
    start: '1.100000',
    end: '1.200000',
    frame_count: 2,
    truncated: false,
    sources: [],
    frames,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [MarkerReplayOverlayComponent],
      providers: [
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: MapScaleService, useValue: { scaleChangeEmitter: new EventEmitter() } },
        { provide: MapSettingsService, useValue: { mapRenderedEmitter: new EventEmitter() } },
        { provide: LinksDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
        { provide: NodesDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkerReplayOverlayComponent);
    component = fixture.componentInstance;
    // The replay service is a component-level provider — resolve it from the
    // component's own injector, not the TestBed root injector.
    svc = fixture.componentRef.injector.get(MarkerReplayService);
    fixture.componentRef.setInput('controller', controller);
    fixture.componentRef.setInput('project', project);
    fixture.componentRef.setInput('tag', 7);
    fixture.componentRef.setInput('zIndex', 1000);
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  it('starts the session on init, renders the window with list rows and the count', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();

    expect(svc.mode()).toBe('frames');
    expect(svc.frames()).toHaveLength(2);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__main')).toBeTruthy();
    expect(el.querySelectorAll('.gns3-replay__row').length).toBe(2);
    expect(el.textContent).toContain('10.0.12.1 → 224.0.0.5');
    expect(el.textContent).toContain('Hello Packet');
    expect(el.textContent).toContain('2 frames'); // header count
    expect(el.querySelector('.gns3-replay__state')).toBeNull(); // loading gone
  });

  it('colors rows with the Wireshark bg/fg data colors (inline, with the # added)', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();

    // Row 0 is SELECTED (cursor starts there) and yields its inline colors to
    // the selection class; row 1 carries the raw data colors. jsdom normalizes
    // hex to rgb on read — compare the normalized form.
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gns3-replay__row');
    expect(rows[0].classList.contains('gns3-replay__row--selected')).toBe(true);
    expect(rows[0].style.background).toBe('');
    expect(rows[1].style.background).toBe('rgb(255, 243, 214)');
    expect(rows[1].style.color).toBe('rgb(18, 39, 46)');
  });

  it('clamps the default window size into the (jsdom) viewport', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();

    // 1024×768 default: width 992 (=1024−32, below the 1100 default), height 640.
    expect(component.winWidth()).toBe(Math.min(1100, window.innerWidth - 32));
    expect(component.winHeight()).toBe(Math.min(640, window.innerHeight - 96));
    expect(component.winTop()).toBe(80);
  });

  it('shows the loading state while the range is in flight', () => {
    mockHttp.get.mockReturnValue(new Subject()); // never emits
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__state')?.textContent).toContain('Loading frames');
  });

  it('shows the empty state for a tag with no captured frames', () => {
    mockHttp.get.mockReturnValue(of({ ...range, start: null, end: null, frame_count: 0, frames: [] }));
    fixture.detectChanges();

    expect(svc.isEmpty()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No frames captured under this tag');
  });

  it('an empty FILTERED result offers Clear filter (distinct from an empty tag)', () => {
    mockHttp.get.mockImplementation((_c: any, url: string) =>
      of(
        url.includes('filter=')
          ? { ...range, start: null, end: null, frame_count: 0, frames: [] }
          : range
      )
    );
    fixture.detectChanges();
    svc.applyFilter('tcp');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No frames match this filter');
    (el.querySelector<HTMLButtonElement>('.gns3-replay__state button')!).click();
    expect(svc.appliedFilter()).toBe('');
    expect(svc.frames()).toHaveLength(2);
  });

  it('network errors keep the window open with a working Retry', () => {
    mockHttp.get.mockReturnValue(throwError(() => ({ error: { message: 'boom' }, message: 'boom' })));
    fixture.detectChanges();

    expect(svc.rangeErrorKind()).toBe('network');
    const el: HTMLElement = fixture.nativeElement;
    const retry = el.querySelector<HTMLButtonElement>('.gns3-replay__retry');
    expect(retry).toBeTruthy();

    mockHttp.get.mockReturnValue(of(range));
    retry!.click();
    fixture.detectChanges();
    expect(svc.rangeError()).toBeNull();
    expect(svc.frames()).toHaveLength(2);
  });

  it('a 501 (sharkd missing) renders the full-window unavailable state with Close, no Retry', () => {
    mockHttp.get.mockReturnValue(
      throwError(() => ({
        error: { message: 'sharkd not installed' },
        message: 'sharkd not installed',
        originalError: { status: 501 },
      }))
    );
    fixture.detectChanges();

    expect(svc.rangeErrorKind()).toBe('unavailable');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('sharkd');
    expect(el.querySelector('.gns3-replay__retry')).toBeNull();
    expect(el.querySelector('.gns3-replay__state button')!.textContent).toContain('Close');
  });

  it('a gate (409) error auto-closes the window', () => {
    const emitted = vi.fn();
    component.closeWindow.subscribe(emitted);
    mockHttp.get.mockReturnValue(
      throwError(() => ({
        error: { message: 'Cannot replay tag 7 while markers are capturing' },
        message: 'Cannot replay tag 7 while markers are capturing',
        originalError: { status: 409 },
      }))
    );
    fixture.detectChanges();
    fixture.detectChanges(); // effect flush

    expect(svc.rangeErrorKind()).toBe('gate');
    expect(emitted).toHaveBeenCalled();
  });

  describe('filter bar', () => {
    it('Enter applies the draft filter and re-rendens the matched list + "of" count', () => {
      mockHttp.get.mockImplementation((_c: any, url: string) =>
        of(url.includes('filter=') ? { ...range, frame_count: 1, frames: [frames[0]] } : range)
      );
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector<HTMLInputElement>('.gns3-replay__filter-input')!;
      input.value = 'ospf.msg == 1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(svc.appliedFilter()).toBe('ospf.msg == 1');
      expect(svc.frames()).toHaveLength(1);
      expect(el.textContent).toContain('1 of 2 frames');
      const url = mockHttp.get.mock.calls.filter((c: any[]) => c[1].includes('/replay/range')).pop()[1];
      expect(url).toContain('filter=ospf.msg%20%3D%3D%201');
    });

    it('a 400 lands INLINE: error text under the bar, the old list stays, no toast', () => {
      const toaster = TestBed.inject(ToasterService);
      mockHttp.get.mockImplementation((_c: any, url: string) =>
        url.includes('filter=')
          ? throwError(() => ({
              error: { message: 'Invalid display filter: Filter expression invalid' },
              message: 'Invalid display filter: Filter expression invalid',
              originalError: { status: 400 },
            }))
          : of(range)
      );
      fixture.detectChanges();

      svc.applyFilter('this is (not valid');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.gns3-replay__filter-error')?.textContent).toContain('Invalid display filter');
      expect(el.querySelectorAll('.gns3-replay__row').length).toBe(2); // last good data kept
      expect(toaster.error).not.toHaveBeenCalled();
    });

    it('the ✕ button clears the filter and reloads the full list', () => {
      mockHttp.get.mockImplementation((_c: any, url: string) =>
        of(url.includes('filter=') ? { ...range, frame_count: 1, frames: [frames[0]] } : range)
      );
      fixture.detectChanges();
      svc.applyFilter('ospf');
      fixture.detectChanges();

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__filter-clear')!.click();
      fixture.detectChanges();
      expect(svc.appliedFilter()).toBe('');
      expect(svc.frames()).toHaveLength(2);
    });
  });

  it('the header 📌 freezes the current frame and disables until the cursor moves on', () => {
    // Route detail decodes to a real tree — the pane reads detail.tree.
    mockHttp.get.mockImplementation((_c: any, url: string) =>
      of(url.includes('frame/detail') ? detailFor(frames[0], 64) : range)
    );
    fixture.detectChanges();

    const btn = () =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__pin')!;
    btn().click();
    fixture.detectChanges();
    expect(svc.pinnedDetails()).toHaveLength(1);
    expect(svc.pinnedDetails()[0].frame.ts).toBe(frames[0].ts);
    expect(btn().disabled).toBe(true); // same frame pinned

    svc.setCurrentIndex(1);
    fixture.detectChanges();
    expect(btn().disabled).toBe(false);
  });

  it('the close button emits closeWindow', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();

    const emitted = vi.fn();
    component.closeWindow.subscribe(emitted);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__close')!.click();
    expect(emitted).toHaveBeenCalled();
  });

  it('renders one pinned window per snapshot OUTSIDE the main window', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();

    svc.pinnedDetails.set([
      { id: 1, frame: frames[0], state: { status: 'ok', detail: detailFor(frames[0], 64) } },
      { id: 2, frame: frames[1], state: { status: 'ok', detail: detailFor(frames[1], 63) } },
    ]);
    fixture.detectChanges();

    // Main window + two pinned windows; the pinned ones carry the close button.
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__main')).toBeTruthy();
    expect(el.querySelectorAll('.gns3-replay__window').length).toBe(2);
    expect(el.querySelectorAll('.gns3-replay__window-close').length).toBe(2);

    // Two decoded pins → the shared diff flags the differing TTL leaf, fed to
    // every pinned window's tree.
    expect(component.pinDiff().has('ip/ip.ttl')).toBe(true);
  });

  it('focusing races: main sits above never-clicked pins, any click raises that window', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();
    svc.pinnedDetails.set([{ id: 1, frame: frames[0], state: { status: 'ok', detail: detailFor(frames[0], 64) } }]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const z = () => ({
      main: (el.querySelector('.gns3-replay__main') as HTMLElement).style.zIndex,
      pin: (el.querySelector('.gns3-replay__window') as HTMLElement).style.zIndex,
    });

    // Pins render after main in DOM order — the 'main' floor keeps it above a
    // never-clicked pin.
    expect(Number(z().main)).toBeGreaterThan(Number(z().pin));

    component.focusWindow('pin-1');
    fixture.detectChanges();
    expect(Number(z().pin)).toBeGreaterThan(Number(z().main));

    component.focusWindow('main');
    fixture.detectChanges();
    expect(Number(z().main)).toBeGreaterThan(Number(z().pin));
  });

  it('fewer than two decoded pins yield an empty diff', () => {
    mockHttp.get.mockReturnValue(of(range));
    fixture.detectChanges();
    svc.pinnedDetails.set([
      { id: 1, frame: frames[0], state: { status: 'ok', detail: detailFor(frames[0], 64) } },
      { id: 2, frame: frames[1], state: { status: 'loading' } },
    ]);
    fixture.detectChanges();
    expect(component.pinDiff().size).toBe(0);
  });
});

/** Decoded-frame fixture whose ip.ttl leaf label differs with `ttl`. */
function detailFor(f: ReplayFrame, ttl: number): ReplayFrameDetail {
  return {
    ts: f.ts,
    source: { node_id: f.node_id, link_id: f.link_id, marker: f.marker, frame_number: f.frame_number },
    field_count: 1,
    hex: 'ab',
    tree: [
      {
        element: 'proto' as const,
        name: 'ip',
        label: 'Internet Protocol Version 4',
        children: [
          {
            element: 'field' as const,
            name: 'ip.ttl',
            label: `Time to Live: ${ttl}`,
            filter_expr: `ip.ttl == ${ttl}`,
            children: [],
          },
        ],
      },
    ],
  };
}
