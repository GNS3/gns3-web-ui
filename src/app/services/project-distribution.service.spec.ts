import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ProjectDistributionService } from './project-distribution.service';
import { ProjectService } from '@services/project.service';
import { UserPreferencesService } from '@services/user-preferences.service';
import { NotificationCenterService } from '@services/notification-center.service';
import { Controller } from '@models/controller';
import { ProjectDistribution } from '@models/project';

const STORAGE_KEY = 'gns3-active-distributions';

const createController = (): Controller => ({ id: 1, username: 'teacher' } as unknown as Controller);

const createJob = (overrides: Partial<ProjectDistribution> = {}): ProjectDistribution =>
  ({
    distribution_id: 'dist-1',
    project_id: 'proj-1',
    name: 'Lab',
    created_by: 'teacher',
    status: 'running',
    total: 2,
    completed: 0,
    results: [],
    error: null,
    ...overrides,
  } as ProjectDistribution);

describe('ProjectDistributionService', () => {
  let service: ProjectDistributionService;
  let mockProjectService: { getDistribution: ReturnType<typeof vi.fn> };
  let mockNotifications: { add: ReturnType<typeof vi.fn> };
  let store: Map<string, string>;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    mockProjectService = { getDistribution: vi.fn() };
    mockNotifications = { add: vi.fn() };
    store = new Map<string, string>();

    TestBed.configureTestingModule({
      providers: [
        ProjectDistributionService,
        { provide: ProjectService, useValue: mockProjectService },
        {
          provide: UserPreferencesService,
          useValue: {
            getItem: vi.fn((key: string) => store.get(key) ?? null),
            setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
          },
        },
        { provide: NotificationCenterService, useValue: mockNotifications },
      ],
    });
    service = TestBed.inject(ProjectDistributionService);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const readStoredIds = (): string[] => {
    const raw = store.get(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { distribution_id: string }[]).map((ref) => ref.distribution_id) : [];
  };

  describe('track', () => {
    it('adds a running job to tracked and persists a ref', () => {
      service.track(createController(), createJob());

      expect(service.tracked().length).toBe(1);
      expect(service.tracked()[0].expired).toBe(false);
      expect(readStoredIds()).toEqual(['dist-1']);
    });

    it('ignores a job already tracked (dedupe by distribution_id)', () => {
      const controller = createController();
      service.track(controller, createJob());
      service.track(controller, createJob({ completed: 1 }));

      expect(service.tracked().length).toBe(1);
      // The later state is not adopted through track(); polling owns updates.
      expect(service.tracked()[0].job.completed).toBe(0);
    });

    it('only pushes a summary for an already-terminal job', () => {
      const job = createJob({
        status: 'completed',
        completed: 1,
        total: 1,
        results: [{ username: 'student-01', project: { name: 'Lab' } as never, error: null }],
      });
      service.track(createController(), job);

      expect(service.tracked().length).toBe(0);
      expect(mockNotifications.add).toHaveBeenCalledWith('success', expect.stringContaining('student-01'));
      expect(readStoredIds()).toEqual([]);
    });
  });

  describe('polling', () => {
    it('updates the tracked state and stops at a terminal status', async () => {
      mockProjectService.getDistribution.mockReturnValue(
        of(createJob({ status: 'completed', completed: 2, total: 2, results: [], name: 'Lab' }))
      );
      service.track(createController(), createJob());

      await vi.advanceTimersByTimeAsync(1000);

      expect(service.tracked()[0].job.status).toBe('completed');
      expect(readStoredIds()).toEqual([]);
      expect(mockNotifications.add).toHaveBeenCalledTimes(1);

      // Terminal: no further polls.
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(1);
    });

    it('marks the job expired and prunes the ref on a 404 poll error', async () => {
      mockProjectService.getDistribution.mockReturnValue(throwError(() => ({ originalError: { status: 404 } })));
      service.track(createController(), createJob());

      await vi.advanceTimersByTimeAsync(1000);

      expect(service.tracked()[0].expired).toBe(true);
      expect(readStoredIds()).toEqual([]);
      expect(mockNotifications.add).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(3000);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(1);
    });

    it('treats a 403 poll error as a foreign leftover ref', async () => {
      mockProjectService.getDistribution.mockReturnValue(throwError(() => ({ originalError: { status: 403 } })));
      service.track(createController(), createJob());

      await vi.advanceTimersByTimeAsync(1000);

      expect(service.tracked()[0].expired).toBe(true);
    });

    it('keeps polling through transient errors', async () => {
      mockProjectService.getDistribution
        .mockReturnValueOnce(throwError(() => ({ originalError: { status: 503 } })))
        .mockReturnValue(
          of(createJob({ status: 'completed', completed: 2, total: 2, results: [], name: 'Lab' }))
        );
      service.track(createController(), createJob());

      await vi.advanceTimersByTimeAsync(2000);

      expect(service.tracked()[0].job.status).toBe('completed');
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(2);
    });
  });

  describe('dismiss', () => {
    it('removes the card and its ref', () => {
      mockProjectService.getDistribution.mockReturnValue(of(createJob()));
      service.track(createController(), createJob());
      expect(readStoredIds()).toEqual(['dist-1']);

      service.dismiss('dist-1');

      expect(service.tracked().length).toBe(0);
      expect(readStoredIds()).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('stops pollers, drops cards, keeps refs and forgets the restore latch', async () => {
      mockProjectService.getDistribution.mockReturnValue(of(createJob()));
      service.track(createController(), createJob());
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(1);

      service.invalidate();

      expect(service.tracked().length).toBe(0);
      // Refs stay: they belong to the outgoing user's server-side document
      // and the same user's next login re-restores them.
      expect(readStoredIds()).toEqual(['dist-1']);

      // Pollers stopped: no further requests for the tracked job.
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(1);

      // Restore latch forgotten: the next login restores again.
      service.restore(createController());
      await vi.advanceTimersByTimeAsync(0);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(2);
      expect(service.tracked().length).toBe(1);
    });
  });

  describe('restore', () => {
    it('retracks running jobs referenced for this controller, once per controller', async () => {
      store.set(
        STORAGE_KEY,
        JSON.stringify([
          { controller_id: 1, project_id: 'proj-1', distribution_id: 'dist-1', name: 'Lab', total: 2 },
        ])
      );
      mockProjectService.getDistribution.mockReturnValue(of(createJob()));

      const controller = createController();
      service.restore(controller);
      await vi.advanceTimersByTimeAsync(0);

      expect(service.tracked().length).toBe(1);

      service.restore(controller);
      await vi.advanceTimersByTimeAsync(0);
      expect(mockProjectService.getDistribution).toHaveBeenCalledTimes(1);
    });

    it('prunes refs the server no longer knows', async () => {
      store.set(
        STORAGE_KEY,
        JSON.stringify([
          { controller_id: 1, project_id: 'proj-1', distribution_id: 'dist-1', name: 'Lab', total: 2 },
        ])
      );
      mockProjectService.getDistribution.mockReturnValue(throwError(() => ({ originalError: { status: 404 } })));

      service.restore(createController());
      await vi.advanceTimersByTimeAsync(0);

      expect(service.tracked().length).toBe(0);
      expect(readStoredIds()).toEqual([]);
    });

    it('pushes the missed outcome for a job that finished meanwhile, without a ref', async () => {
      store.set(
        STORAGE_KEY,
        JSON.stringify([
          { controller_id: 1, project_id: 'proj-1', distribution_id: 'dist-1', name: 'Lab', total: 1 },
        ])
      );
      mockProjectService.getDistribution.mockReturnValue(
        of(
          createJob({
            status: 'completed',
            completed: 1,
            total: 1,
            results: [{ username: 'student-01', project: { name: 'Lab' } as never, error: null }],
          })
        )
      );

      service.restore(createController());
      await vi.advanceTimersByTimeAsync(0);

      expect(service.tracked().length).toBe(0);
      expect(mockNotifications.add).toHaveBeenCalledWith('success', expect.stringContaining('student-01'));
      expect(readStoredIds()).toEqual([]);
    });

    it('ignores refs with a foreign controller id', async () => {
      store.set(
        STORAGE_KEY,
        JSON.stringify([
          { controller_id: 99, project_id: 'proj-1', distribution_id: 'dist-1', name: 'Lab', total: 2 },
        ])
      );

      service.restore(createController());
      await vi.advanceTimersByTimeAsync(0);

      expect(mockProjectService.getDistribution).not.toHaveBeenCalled();
    });

    it('tolerates corrupted stored refs', async () => {
      store.set(STORAGE_KEY, '{not json');

      service.restore(createController());
      await vi.advanceTimersByTimeAsync(0);

      expect(mockProjectService.getDistribution).not.toHaveBeenCalled();
    });
  });

  describe('summaries', () => {
    it('reports a failed job as an error notification', () => {
      service.track(
        createController(),
        createJob({ status: 'failed', error: { message: 'boom' }, results: [] })
      );

      expect(mockNotifications.add).toHaveBeenCalledWith('error', expect.stringContaining('boom'));
    });

    it('names the single copy and its owner for one recipient', () => {
      service.track(
        createController(),
        createJob({
          status: 'completed',
          completed: 1,
          total: 1,
          results: [{ username: 'student-01', project: { name: 'Lab' } as never, error: null }],
        })
      );

      const [kind, message] = mockNotifications.add.mock.calls[0];
      expect(kind).toBe('success');
      expect(message).toContain('"Lab"');
      expect(message).toContain('student-01');
    });

    it('summarizes a multi-recipient success', () => {
      service.track(
        createController(),
        createJob({
          status: 'completed',
          completed: 2,
          total: 2,
          results: [
            { username: 'student-01', project: { name: 'Lab' } as never, error: null },
            { username: 'student-02', project: { name: 'Lab' } as never, error: null },
          ],
        })
      );

      const [kind, message] = mockNotifications.add.mock.calls[0];
      expect(kind).toBe('success');
      expect(message).toContain('2 users');
    });

    it('warns about partial failure and lists the failed recipients', () => {
      service.track(
        createController(),
        createJob({
          status: 'completed',
          completed: 2,
          total: 2,
          results: [
            { username: 'student-01', project: { name: 'Lab' } as never, error: null },
            { username: 'student-02', project: null, error: { message: 'disk full' } },
          ],
        })
      );

      const [kind, message] = mockNotifications.add.mock.calls[0];
      expect(kind).toBe('warning');
      expect(message).toContain('1 of 2');
      expect(message).toContain('student-02');
    });
  });
});
