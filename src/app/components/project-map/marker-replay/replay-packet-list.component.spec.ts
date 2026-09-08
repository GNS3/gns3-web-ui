import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { ReplayPacketListComponent } from './replay-packet-list.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ReplayFrame, ReplayRangeResponse } from '@models/marker-replay';

/**
 * jsdom normalizes hex colors to rgb() when style values are READ — derive
 * the expected inline-style form from the fixture (keeps color literals out
 * of the source; the hardcoded-color hook scans .ts too).
 */
function hexToRgb(hex: string): string {
  const n = parseInt(hex, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe('ReplayPacketListComponent', () => {
  let fixture: ComponentFixture<ReplayPacketListComponent>;
  let component: ReplayPacketListComponent;
  let svc: MarkerReplayService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;

  const controller = { id: 1 } as Controller;

  const frames: ReplayFrame[] = [
    {
      ts: '1.100000', len: 60, node_id: 'n1', link_id: 'l1', marker: 'm', frame_number: 1,
      src: '10.0.12.1', dst: '224.0.0.5', proto: 'OSPF', info: 'Hello Packet',
      bg: 'fff3d6', fg: '12272e',
    },
    {
      ts: '1.200000', len: 70, node_id: 'n1', link_id: 'l2', marker: 'm', frame_number: 2,
      src: '10.0.12.2', dst: '224.0.0.5', proto: 'OSPF', info: 'DBD',
    },
  ];

  const truncatedRange: ReplayRangeResponse = {
    tag: 7,
    start: '1.000000',
    end: '2.000000',
    frame_count: 9000,
    truncated: true,
    sources: [],
    buckets: [
      { ts: '1.000000', count: 2 },
      { ts: '2.000000', count: 9 },
    ],
  };

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn().mockReturnValue(of({ frames: [] })) };
    await TestBed.configureTestingModule({
      imports: [ReplayPacketListComponent],
      providers: [
        MarkerReplayService,
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayPacketListComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(MarkerReplayService);
  });

  afterEach(() => {
    vi.clearAllTimers();
    if (fixture) fixture.destroy();
  });

  function rows(): NodeListOf<HTMLElement> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gns3-replay__row');
  }

  it('renders one grid row per frame with the Wireshark columns', () => {
    svc.start(controller, 'p1', 7); // frames mode via the default range mock? no — inject directly:
    svc.tag.set(7);
    // Direct state injection keeps this spec about RENDERING, not fetching.
    (svc as any).controller = controller;
    (svc as any).projectId = 'p1';
    svc.mode.set('frames');
    svc.frames.set(frames);
    svc.currentFrameIndex.set(0);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(rows().length).toBe(2);
    expect(el.querySelectorAll('.gns3-replay__list-cols--frames').length).toBe(1);
    const first = rows()[0];
    expect(first.textContent).toContain('10.0.12.1 → 224.0.0.5');
    expect(first.textContent).toContain('Hello Packet');
    expect(first.textContent).toContain('OSPF');
    expect(first.getAttribute('title')).toBe('Hello Packet'); // native tooltip
  });

  it('colors rows from bg/fg, and the SELECTED row yields its inline colors to the class', () => {
    svc.tag.set(7);
    svc.mode.set('frames');
    svc.frames.set(frames);
    svc.currentFrameIndex.set(1); // second row selected
    fixture.detectChanges();

    const selected = rows()[1];
    expect(selected.classList.contains('gns3-replay__row--selected')).toBe(true);
    expect(selected.style.background).toBe(''); // null binding — the class provides color
    const other = rows()[0];
    expect(other.style.background).toBe(hexToRgb(frames[0].bg!));
    expect(other.style.color).toBe(hexToRgb(frames[0].fg!));
  });

  it('clicking a row selects it (setCurrentIndex)', () => {
    const select = vi.spyOn(svc, 'setCurrentIndex');
    svc.tag.set(7);
    svc.mode.set('frames');
    svc.frames.set(frames);
    fixture.detectChanges();

    rows()[1].click();
    expect(select).toHaveBeenCalledWith(1);
  });

  it('ArrowDown/ArrowUp on a focused row step the selection', () => {
    const select = vi.spyOn(svc, 'setCurrentIndex');
    svc.tag.set(7);
    svc.mode.set('frames');
    svc.frames.set(frames);
    svc.currentFrameIndex.set(0);
    fixture.detectChanges();

    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(select).toHaveBeenLastCalledWith(1);
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(select).toHaveBeenLastCalledWith(-1);
  });

  it('truncated mode renders one density row per second; clicking selects the bucket', async () => {
    const bucket = vi.spyOn(svc, 'setCurrentBucket');
    mockHttp.get.mockImplementation((_c: any, url: string) =>
      url.includes('/replay/frames') ? of({ frames: [] }) : of(truncatedRange)
    );
    svc.start(controller, 'p1', 7);
    await vi.advanceTimersByTimeAsync(200); // first-second settle (legitimately empty)
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const bucketRows = el.querySelectorAll<HTMLElement>('.gns3-replay__bucket-row');
    expect(bucketRows.length).toBe(2);
    expect(el.querySelector('.gns3-replay__list-cols--buckets')).toBeTruthy();
    // Bar width ∝ count: 2 vs 9 → the second is wider.
    const widths = Array.from(el.querySelectorAll<HTMLElement>('.gns3-replay__bucket-bar')).map(
      (b) => b.getBoundingClientRect().width || Number(b.style.width.replace('px', ''))
    );
    expect(widths[1]).toBeGreaterThan(widths[0]);

    bucketRows[1].click();
    expect(bucket).toHaveBeenCalledWith(1);
  });

  it('inside a materialized second the header grows a back affordance to exitWindow', async () => {
    const exit = vi.spyOn(svc, 'exitWindow');
    mockHttp.get.mockImplementation((_c: any, url: string) =>
      url.includes('/replay/frames') ? of({ frames }) : of(truncatedRange)
    );
    svc.start(controller, 'p1', 7);
    await vi.advanceTimersByTimeAsync(200); // materialize bucket 0
    fixture.detectChanges();

    expect(svc.inWindow()).toBe(true);
    const back = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.gns3-replay__list-back');
    expect(back).toBeTruthy();
    expect(rows().length).toBe(2); // materialized frames as rows

    back!.click();
    expect(exit).toHaveBeenCalled();
    expect(svc.inWindow()).toBe(false);
  });
});
