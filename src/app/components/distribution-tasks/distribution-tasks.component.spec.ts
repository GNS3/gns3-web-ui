import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { DistributionTasksComponent } from './distribution-tasks.component';
import { ProjectDistributionService, TrackedDistribution } from '@services/project-distribution.service';
import { Controller } from '@models/controller';
import { ProjectDistribution } from '@models/project';

describe('DistributionTasksComponent', () => {
  let fixture: ComponentFixture<DistributionTasksComponent>;
  let component: DistributionTasksComponent;
  let mockTracked: ReturnType<typeof signal<TrackedDistribution[]>>;
  let mockDismiss: ReturnType<typeof vi.fn>;

  const controller = { id: 1, username: 'teacher' } as unknown as Controller;

  const createJob = (overrides: Partial<ProjectDistribution> = {}): ProjectDistribution =>
    ({
      distribution_id: 'dist-1',
      project_id: 'proj-1',
      name: 'Lab',
      created_by: 'teacher',
      status: 'running',
      total: 2,
      completed: 1,
      results: [],
      error: null,
      ...overrides,
    } as ProjectDistribution);

  const track = (job: ProjectDistribution, expired = false): TrackedDistribution => ({
    controller,
    job,
    expired,
    cancelPending: false,
  });

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    mockTracked = signal<TrackedDistribution[]>([]);
    mockDismiss = vi.fn();

    await TestBed.configureTestingModule({
      imports: [DistributionTasksComponent],
      providers: [{ provide: ProjectDistributionService, useValue: { tracked: mockTracked, dismiss: mockDismiss } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DistributionTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('renders nothing without tracked jobs', () => {
    expect(fixture.nativeElement.querySelector('.distribution-tasks')).toBeNull();
  });

  it('renders one card per job with its progress', () => {
    mockTracked.set([track(createJob()), track(createJob({ distribution_id: 'dist-2' }))]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.distribution-tasks__card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('.distribution-tasks__name').textContent).toContain('Lab');
    expect(cards[0].querySelector('.distribution-tasks__count').textContent).toContain('1 of 2');
  });

  it('shows the expiry hint instead of a progress bar for expired jobs', () => {
    mockTracked.set([track(createJob(), true)]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.distribution-tasks__expired')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.distribution-tasks__count')).toBeNull();
  });

  it('expands per-recipient results on header click', () => {
    mockTracked.set([
      track(
        createJob({
          results: [
            { username: 'student-01', project: { name: 'Lab-student-01' } as never, error: null },
            { username: 'student-02', project: null, error: { message: 'disk full' } },
          ],
        })
      ),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.distribution-tasks__results')).toBeNull();

    fixture.nativeElement.querySelector('.distribution-tasks__header').click();
    fixture.detectChanges();

    const results = fixture.nativeElement.querySelectorAll('.distribution-tasks__result');
    expect(results.length).toBe(2);
    expect(results[1].textContent).toContain('disk full');
  });

  it('dismisses a card through the service', () => {
    mockTracked.set([track(createJob())]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.distribution-tasks__dismiss').click();

    expect(mockDismiss).toHaveBeenCalledWith('dist-1');
  });

  it('auto-dismisses a fully successful job once its delay elapses', async () => {
    mockTracked.set([
      track(
        createJob({
          status: 'completed',
          completed: 2,
          total: 2,
          results: [
            { username: 'student-01', project: { name: 'Lab' } as never, error: null },
            { username: 'student-02', project: { name: 'Lab' } as never, error: null },
          ],
        })
      ),
    ]);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(6000);

    expect(mockDismiss).toHaveBeenCalledWith('dist-1');
  });

  it('keeps a partial-failure card until dismissed manually', async () => {
    mockTracked.set([
      track(
        createJob({
          status: 'completed',
          completed: 2,
          total: 2,
          results: [
            { username: 'student-01', project: { name: 'Lab' } as never, error: null },
            { username: 'student-02', project: null, error: { message: 'disk full' } },
          ],
        })
      ),
    ]);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(60000);

    expect(mockDismiss).not.toHaveBeenCalled();
  });
});
