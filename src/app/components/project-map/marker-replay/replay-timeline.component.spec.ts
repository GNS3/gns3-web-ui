import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { ReplayTimelineComponent } from './replay-timeline.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { ReplayFrame, ReplayRangeResponse } from '@models/marker-replay';

describe('ReplayTimelineComponent', () => {
  let fixture: ComponentFixture<ReplayTimelineComponent>;
  let component: ReplayTimelineComponent;
  let svc: MarkerReplayService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;
  const controller = { id: 1 } as Controller;

  /** 40 frames, 10 per second — enough for slice + tick assertions. */
  function frames(n: number): ReplayFrame[] {
    return Array.from({ length: n }, (_, i) => ({
      ts: (1000 + i / 10).toFixed(1) + '00000', // 0.1s pitch, µs-shaped ("1000.000000")
      len: 60,
      node_id: 'n1',
      link_id: 'l1',
      marker: 'm',
      frame_number: i + 1,
    }));
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ReplayTimelineComponent],
      providers: [
        MarkerReplayService,
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayTimelineComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(MarkerReplayService);
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  function loadRange(range: ReplayRangeResponse) {
    mockHttp.get.mockReturnValue(of(range));
    svc.start(controller, 'p1', 7);
    fixture.detectChanges();
  }

  const fullRange = (n: number): ReplayRangeResponse => ({
    tag: 7,
    start: frames(n)[0].ts,
    end: frames(n)[n - 1].ts,
    frame_count: n,
    truncated: false,
    sources: [],
    frames: frames(n),
  });

  it('renders the visible slice around the cursor and only that slice', () => {
    loadRange(fullRange(40));
    const el: HTMLElement = fixture.nativeElement;
    const lines = el.querySelectorAll('.gns3-replay__line');
    // At index 0: rows 0..~21 (viewport half + buffer).
    expect(lines.length).toBeGreaterThan(10);
    expect(lines.length).toBeLessThan(40);

    svc.setCurrentIndex(20);
    fixture.detectChanges();
    expect(el.querySelectorAll('.gns3-replay__line').length).toBe(40); // mid-list slice covers all
  });

  it('marks the current line and shows the cursor time bubble with HH:MM:SS', () => {
    loadRange(fullRange(40));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__line--current')).toBeTruthy();
    expect(el.querySelector('.gns3-replay__cursor-label')?.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('renders adaptive HH:MM:SS ticks for a multi-second span', () => {
    loadRange(fullRange(40)); // spans ~4s
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.gns3-replay__tick').length).toBeGreaterThan(0);
  });

  it('a single wheel notch steps exactly one frame', () => {
    loadRange(fullRange(40));
    const tape = fixture.nativeElement.querySelector('.gns3-replay__tape')!;
    tape.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(1);

    tape.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(0);
  });

  it('▲ ▼ buttons step exactly one frame', () => {
    loadRange(fullRange(40));
    const buttons = fixture.nativeElement.querySelectorAll('.gns3-replay__step-btn');
    buttons[1].click(); // forward
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(1);
    buttons[0].click(); // backward
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(0);
  });

  it('clicking a frame line selects it', () => {
    loadRange(fullRange(40));
    const lines = fixture.nativeElement.querySelectorAll('.gns3-replay__line');
    (lines[5] as HTMLElement).click();
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(5);
  });

  it('the 📌 button freezes the current frame into a comparison window', () => {
    loadRange(fullRange(40));
    svc.setCurrentIndex(3);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector<HTMLButtonElement>('.gns3-replay__pin-btn');
    expect(btn).toBeTruthy();
    btn!.click();
    fixture.detectChanges();

    expect(svc.pinnedDetails()).toHaveLength(1);
    expect(svc.pinnedDetails()[0].frame.ts).toBe(frames(40)[3].ts);
    // Same frame pinned → the button disables until the cursor moves on.
    expect(btn!.disabled).toBe(true);
    svc.setCurrentIndex(4);
    fixture.detectChanges();
    expect(el.querySelector<HTMLButtonElement>('.gns3-replay__pin-btn')!.disabled).toBe(false);
  });

  it('bookmark chips appear for bookmarks and jump back to the frame', () => {
    loadRange(fullRange(40));
    svc.setCurrentIndex(5);
    svc.toggleBookmark();
    svc.setCurrentIndex(0);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const chip = el.querySelector<HTMLButtonElement>('.gns3-replay__bookmark-chip');
    expect(chip).toBeTruthy();
    expect(chip!.textContent).toContain('#1');

    chip!.click();
    fixture.detectChanges();
    expect(svc.currentFrameIndex()).toBe(5);
  });

  it('bucket mode renders density bars and steps one bucket per notch', () => {
    const buckets = Array.from({ length: 20 }, (_, i) => ({ ts: `${1000 + i}.000000`, count: i + 1 }));
    mockHttp.get.mockImplementation((_c: any, url: string) => {
      if (url.includes('/replay/frames')) return of({ frames: [] });
      return of({ tag: 7, start: buckets[0].ts, end: buckets[19].ts, frame_count: 9000, truncated: true, sources: [], buckets });
    });
    svc.start(controller, 'p1', 7);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.gns3-replay__bucket').length).toBe(20);
    expect(el.querySelector('.gns3-replay__line')).toBeNull();

    const tape = el.querySelector('.gns3-replay__tape')!;
    tape.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
    fixture.detectChanges();
    expect(svc.currentBucketIndex()).toBe(1);
  });
});
