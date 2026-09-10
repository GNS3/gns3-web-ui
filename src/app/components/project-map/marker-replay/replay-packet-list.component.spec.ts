import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { ReplayPacketListComponent, ROW_H } from './replay-packet-list.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ReplayFrame, ReplayRangeResponse } from '@models/marker-replay';

/** The component's default column template — the SCSS keeps no fallback copy. */
const DEFAULT_COLS = '104px minmax(100px, 1fr) minmax(100px, 1fr) 58px 42px minmax(110px, 2fr)';

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
    // No "#" column — per-pcap frame numbers are meaningless after the merge.
    expect(el.querySelector('.gns3-replay__list-cols--frames')?.textContent).not.toContain('#');
    const first = rows()[0];
    expect(first.textContent).toContain('10.0.12.1');
    expect(first.textContent).toContain('224.0.0.5');
    expect(first.textContent).toContain('Hello Packet');
    expect(first.textContent).toContain('OSPF');
    expect(first.textContent).toContain('.100000'); // µs fraction, from the ts string
    expect(first.getAttribute('title')).toBe('Hello Packet'); // native tooltip
  });

  it('binds bg/fg as row CSS variables; the selected class out-ranks them', () => {
    svc.tag.set(7);
    svc.mode.set('frames');
    svc.frames.set(frames);
    svc.currentFrameIndex.set(1); // second row selected
    fixture.detectChanges();

    const selected = rows()[1];
    expect(selected.classList.contains('gns3-replay__row--selected')).toBe(true);
    const other = rows()[0];
    expect(other.style.getPropertyValue('--pkt-bg')).toBe(`#${frames[0].bg}`);
    expect(other.style.getPropertyValue('--pkt-fg')).toBe(`#${frames[0].fg}`);
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

  it('ArrowDown/ArrowUp step the SELECTION from the selection (focus need not follow)', () => {
    svc.tag.set(7);
    svc.mode.set('frames');
    svc.frames.set(frames);
    svc.currentFrameIndex.set(0);
    fixture.detectChanges();

    // Focus stays on row 0 for every press — the step must still advance
    // (the stuck-after-one-press regression stepped from the FOCUSED row).
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(svc.currentFrameIndex()).toBe(1);
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(svc.currentFrameIndex()).toBe(1); // clamped at the list end — no-op
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(svc.currentFrameIndex()).toBe(0);
  });

  it('windows long lists — a slice mounts, spacers keep the full scroll height', () => {
    svc.tag.set(7);
    svc.mode.set('frames');
    const many: ReplayFrame[] = Array.from({ length: 500 }, (_, i) => ({
      ...frames[0],
      ts: (1 + i / 1000).toFixed(6),
      frame_number: i + 1,
    }));
    svc.frames.set(many);
    svc.currentFrameIndex.set(0);
    fixture.detectChanges();

    // jsdom cannot measure the scroller → the fallback viewport (40 rows)
    // plus one buffer band below mounts (top buffer clamps at 0).
    expect(rows().length).toBe(40 + 8);
    expect(rows()[0].getAttribute('data-index')).toBe('0');

    // Cursor far down the list (keyboard outran the scroll) → the window
    // SLIDES to it — mounting everything in between would defeat the windowing.
    svc.currentFrameIndex.set(300);
    fixture.detectChanges();
    const indexes = Array.from(rows()).map((r) => Number(r.getAttribute('data-index')));
    expect(indexes).toContain(300);
    expect(indexes[0]).toBe(300 - 20 - 8); // half-viewport (20) + buffer above
    expect(rows().length).toBe(2 * (20 + 8) + 1);

    // Top + mounted + bottom spacer heights = the full 500-row scroll height.
    const pads = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gns3-replay__list-pad');
    const paddedRows = Array.from(pads).reduce((sum, p) => sum + Number(p.style.height.replace('px', '')), 0) / ROW_H;
    expect(paddedRows + rows().length).toBe(500);
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

  describe('column resize (header grips)', () => {
    function drag(gripIndex: number, dx: number) {
      const grips = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gns3-replay__col-grip');
      grips[gripIndex].dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + dx }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      fixture.detectChanges();
    }

    const colsVar = () => (fixture.nativeElement as HTMLElement).style.getPropertyValue('--gns3-replay-cols');

    beforeEach(() => {
      svc.tag.set(7);
      svc.mode.set('frames');
      svc.frames.set(frames);
      fixture.detectChanges();
    });

    it('seeds the default grid at construction; dragging a grip rewrites it', () => {
      // Seeded from colWidths — the SCSS keeps no fallback copy of the default.
      expect(colsVar()).toBe(DEFAULT_COLS);
      drag(0, 30); // Time: 104 + 30
      expect(colsVar()).toBe('134px minmax(100px, 1fr) minmax(100px, 1fr) 58px 42px minmax(110px, 2fr)');
    });

    it('dragging a flexible address column pins it to a px width', () => {
      drag(1, 0); // jsdom cannot measure cells — the fallback start (150) applies
      expect(colsVar()).toContain('150px minmax(100px, 1fr)');
    });

    it('widths clamp to the column minimum', () => {
      drag(4, -500); // Len: floor is 34
      expect(colsVar()).toContain('34px minmax(110px, 2fr)');
    });
  });
});
