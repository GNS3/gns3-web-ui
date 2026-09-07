import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { ReplayDetailPaneComponent } from './replay-detail-pane.component';
import { MarkerReplayService } from '@services/marker-replay.service';
import { HttpController } from '@services/http-controller.service';
import { ToasterService } from '@services/toaster.service';
import { LinksDataSource } from '../../../cartography/datasources/links-datasource';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DetailState, ReplayFrame, ReplayFrameDetail } from '@models/marker-replay';

describe('ReplayDetailPaneComponent', () => {
  let fixture: ComponentFixture<ReplayDetailPaneComponent>;
  let component: ReplayDetailPaneComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttp: any;

  const frame: ReplayFrame = {
    ts: '1788196663.100000',
    len: 98,
    node_id: 'n1',
    link_id: 'l1',
    marker: 'global-arp',
    frame_number: 1,
  };
  const detail: ReplayFrameDetail = {
    ts: frame.ts,
    source: { node_id: 'n1', link_id: 'l1', marker: 'global-arp', frame_number: 1 },
    field_count: 1,
    hex: 'ab',
    tree: [
      {
        element: 'proto',
        name: 'ip',
        label: 'Internet Protocol Version 4, Src: 10.0.0.1',
        children: [
          { element: 'field', name: 'ip.ttl', label: 'Time to Live: 64', filter_expr: 'ip.ttl == 64', children: [] },
        ],
      },
    ],
  };
  const ok: DetailState = { status: 'ok', detail };

  // Per the unit-testing skill: zoneless async tests run under fake timers
  // (real macrotask awaits starve) — they also flush the tree's search effects.
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHttp = { get: vi.fn().mockReturnValue(of({})) };
    await TestBed.configureTestingModule({
      imports: [ReplayDetailPaneComponent],
      providers: [
        MarkerReplayService,
        { provide: HttpController, useValue: mockHttp },
        { provide: ToasterService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: LinksDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
        { provide: NodesDataSource, useValue: { get: vi.fn().mockReturnValue(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayDetailPaneComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('frame', frame);
    fixture.componentRef.setInput('state', ok);
  });

  afterEach(() => {
    vi.clearAllTimers();
    if (fixture) fixture.destroy();
  });

  it('renders the protocol crumbs and metadata chips for a decoded frame', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.gns3-replay__crumb')?.textContent).toContain('IP');
    expect(el.querySelector('.gns3-replay__meta-chips')).toBeTruthy();
    expect(el.textContent).toContain('98 B');
    // LinksDataSource returns null → the shortened link id.
    expect(el.textContent).toContain('l1');
  });

  it('shows the spinner while decoding and the neutral idle text otherwise', () => {
    fixture.componentRef.setInput('state', { status: 'loading' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.gns3-replay__detail-spinner')).toBeTruthy();

    fixture.componentRef.setInput('state', { status: 'idle' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No frame decoded yet.');
  });

  it('unavailable errors explain the sharkd dependency and Retry re-emits', () => {
    fixture.componentRef.setInput('state', {
      status: 'error',
      kind: 'unavailable',
      message: 'sharkd is not installed',
      frame,
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('sharkd');

    const retried = vi.fn();
    component.retry.subscribe(retried);
    (el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!).click();
    expect(retried).toHaveBeenCalledOnce();
  });

  it('missing (stale ts) renders Reload timeline by default and Close for pins', () => {
    const stale = { status: 'error', kind: 'missing', message: 'rebuilt', frame } as DetailState;
    fixture.componentRef.setInput('state', stale);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect((el.querySelector('.gns3-replay__detail-error button') as HTMLElement).textContent).toContain(
      'Reload timeline'
    );

    fixture.componentRef.setInput('missingAction', 'close');
    fixture.detectChanges();
    expect((el.querySelector('.gns3-replay__detail-error button') as HTMLElement).textContent).toContain('Close');

    const reloaded = vi.fn();
    component.reload.subscribe(reloaded);
    (el.querySelector<HTMLButtonElement>('.gns3-replay__detail-error button')!).click();
    expect(reloaded).toHaveBeenCalledOnce();
  });

  it('forwards the tree field filter_expr as applyFilter', async () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    // Expand the protocol row, then click the field's Apply-as-filter button.
    (el.querySelector<HTMLElement>('.gns3-replay__tree-row') as HTMLElement).click();
    fixture.detectChanges();

    const applied: string[] = [];
    component.applyFilter.subscribe((e) => applied.push(e));
    (el.querySelector<HTMLButtonElement>('.gns3-replay__tree-filter-btn')!).click();
    expect(applied).toEqual(['ip.ttl == 64']);
  });
});
