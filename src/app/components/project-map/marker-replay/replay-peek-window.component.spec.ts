import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { ReplayPeekWindowComponent } from './replay-peek-window.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { Controller } from '@models/controller';
import { ReplayFrame, ReplayFrameDetail } from '@models/marker-replay';

describe('ReplayPeekWindowComponent (transient double-click detail window)', () => {
  let fixture: ComponentFixture<ReplayPeekWindowComponent>;
  let component: ReplayPeekWindowComponent;
  let svc: MarkerReplayService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;

  const controller = { id: 1 } as Controller;

  const frames: ReplayFrame[] = [
    { ts: '1788196663.100000', len: 98, node_id: 'n1', link_id: 'l1', marker: 'global-arp', frame_number: 1 },
    { ts: '1788196663.200000', len: 74, node_id: 'n1', link_id: 'l2', marker: 'global-arp', frame_number: 2 },
  ];
  const detail: ReplayFrameDetail = {
    ts: frames[0].ts,
    source: { node_id: 'n1', link_id: 'l1', marker: 'global-arp', frame_number: 1 },
    field_count: 1,
    hex: 'ab',
    tree: [{ element: 'proto', name: 'ip', label: 'Internet Protocol Version 4', children: [] }],
  };

  /** Directly seed the service's peek signal (a birth = fresh seq), then render. */
  let seq = 0;
  function open(frame: ReplayFrame, at: { x: number; y: number }): void {
    svc.peek.set({ seq: ++seq, frame, at, detail: { status: 'ok', detail } });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn().mockReturnValue(of({})) };

    await TestBed.configureTestingModule({
      imports: [ReplayPeekWindowComponent],
      providers: [
        MarkerReplayService,
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: LinksDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
        { provide: NodesDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayPeekWindowComponent);
    component = fixture.componentInstance;
    svc = TestBed.inject(MarkerReplayService);
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  it('is born at the double-click point (clamped) and closes via ✕', () => {
    open(frames[0], { x: 900, y: 100 });
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.gns3-replay__window--peek')).toBeTruthy();
    expect(el.querySelector('.gns3-replay__meta-chips')).toBeTruthy(); // the shared pane body
    // 914 would overflow jsdom's 1024px viewport → clamped to 1024−600.
    expect(component.winLeft()).toBe(1024 - component.winWidth());
    expect(component.winWidth()).toBe(component.DEFAULT_W);
    expect(component.winTop()).toBe(100 - 12); // birth offset clears the cursor

    (el.querySelector<HTMLButtonElement>('.gns3-replay__window-close'))!.click();
    expect(svc.peek()).toBeNull();
  });

  it('a decode update keeps the dragged geometry; a BIRTH re-places', () => {
    open(frames[0], { x: 100, y: 100 });
    expect(component.winLeft()).toBe(114);
    component.winLeft.set(500); // the user dragged the window away
    fixture.detectChanges();

    // State-only rewrite (a decode landing) — same seq, geometry kept.
    const p = svc.peek()!;
    svc.peek.set({ ...p, detail: { status: 'loading' } });
    fixture.detectChanges();
    expect(component.winLeft()).toBe(500);

    // Retarget to another frame — a new birth, moves to the new spot.
    open(frames[1], { x: 40, y: 90 });
    expect(component.winLeft()).toBe(54);
    expect(component.winTop()).toBe(90 - 12);

    // Re-opening the SAME frame counts as a birth too (double-clicked elsewhere).
    open(frames[1], { x: 300, y: 80 });
    expect(component.winLeft()).toBe(314);
  });

  it('right-click on the TITLE BAR closes the peek (and only there)', () => {
    open(frames[0], { x: 100, y: 100 });
    const el: HTMLElement = fixture.nativeElement;

    // Inside the body a context menu is a normal browser gesture — no close.
    el.querySelector('.gns3-replay__meta-chips')!.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    );
    expect(svc.peek()).not.toBeNull();

    // The title bar (the drag-handle strip) dismisses instead.
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    el.querySelector('.gns3-replay__window-header')!.dispatchEvent(ev);
    expect(svc.peek()).toBeNull();
    expect(ev.defaultPrevented).toBe(true); // browser menu suppressed
  });

  it('resize end events clamp to the minimum size and viewport', () => {
    open(frames[0], { x: 100, y: 100 });
    component.onResizeEnd({ rectangle: { width: 50, height: 50 } } as any);
    expect(component.winWidth()).toBe(component.MIN_W);
    expect(component.winHeight()).toBe(component.MIN_H);
    expect(component.resizing()).toBe(false);
  });
});
