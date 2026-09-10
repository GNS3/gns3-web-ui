import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { ReplayPacketListComponent, ROW_H } from './replay-packet-list.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ReplayFrame } from '@models/marker-replay';

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
    svc.tag.set(7);
    // Direct state injection keeps this spec about RENDERING, not fetching.
    (svc as any).controller = controller;
    (svc as any).projectId = 'p1';
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
    svc.frames.set(frames);
    fixture.detectChanges();

    rows()[1].click();
    expect(select).toHaveBeenCalledWith(1);
  });

  it('ArrowDown/ArrowUp step the SELECTION from the selection (focus need not follow)', () => {
    svc.tag.set(7);
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
    const many: ReplayFrame[] = Array.from({ length: 500 }, (_, i) => ({
      ...frames[0],
      ts: (1 + i / 1000).toFixed(6),
      frame_number: i + 1,
    }));
    svc.frames.set(many);
    svc.currentFrameIndex.set(0);
    fixture.detectChanges();

    // jsdom cannot measure the scroller → the fallback viewport (40 rows)
    // plus the render-ahead band below mounts (top buffer clamps at 0).
    expect(rows().length).toBe(40 + 24);
    expect(rows()[0].getAttribute('data-index')).toBe('0');

    // Scroll deep: the window follows the SCROLL position — scrolling away
    // from the selection must never strand the viewport on a blank spacer
    // (the all-white regression came from sliding the window back to the
    // stale cursor instead).
    component.onScroll({ target: { scrollTop: 300 * ROW_H, clientHeight: 400 } } as unknown as Event);
    fixture.detectChanges();
    let indexes = Array.from(rows()).map((r) => Number(r.getAttribute('data-index')));
    expect(indexes[0]).toBe(300 - 8); // buffer above
    expect(indexes).not.toContain(0); // the window really moved
    expect(rows().length).toBe((300 + Math.ceil(400 / ROW_H)) - (300 - 8) + 24);

    // Keyboard stepping past the edge: the scroll signal syncs WITH the
    // selection, so the cursor row mounts on the SAME flush — no white gap
    // while the scroll event is still in flight.
    svc.currentFrameIndex.set(300);
    rows()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    indexes = Array.from(rows()).map((r) => Number(r.getAttribute('data-index')));
    expect(indexes).toContain(301);

    // Top + mounted + bottom spacer heights = the full 500-row scroll height.
    const pads = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.gns3-replay__list-pad');
    const paddedRows = Array.from(pads).reduce((sum, p) => sum + Number(p.style.height.replace('px', '')), 0) / ROW_H;
    expect(paddedRows + rows().length).toBe(500);
  });

  it('the render window FOLLOWS scrolling — the slice always covers the viewport', () => {
    svc.tag.set(7);
    const many: ReplayFrame[] = Array.from({ length: 500 }, (_, i) => ({
      ...frames[0],
      ts: (1 + i / 1000).toFixed(6),
      frame_number: i + 1,
    }));
    svc.frames.set(many);
    fixture.detectChanges();

    // jsdom cannot lay out — drive the scroll handler with a real-ish
    // scroller state (scrolled 2000px down, 400px viewport).
    component.onScroll({ target: { scrollTop: 2000, clientHeight: 400 } } as unknown as Event);
    fixture.detectChanges();

    const indexes = Array.from(rows()).map((r) => Number(r.getAttribute('data-index')));
    expect(indexes[0]).toBeLessThanOrEqual(Math.floor(2000 / ROW_H)); // viewport top covered…
    expect(indexes[indexes.length - 1]).toBeGreaterThanOrEqual(Math.ceil(2400 / ROW_H)); // …and the bottom
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
