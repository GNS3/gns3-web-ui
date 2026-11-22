import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { DistributionHistoryDialogComponent, DistributionHistoryDialogData } from './distribution-history-dialog.component';
import { ProjectService } from '@services/project.service';
import { PermissionService } from '@services/permission.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { Project, ProjectDistribution, ProjectDistributionResult } from '@models/project';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DistributionHistoryDialogComponent', () => {
  let component: DistributionHistoryDialogComponent;
  let fixture: ComponentFixture<DistributionHistoryDialogComponent>;
  let mockProjectService: any;
  let mockToaster: any;
  let mockDialog: any;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let isSuperadmin: boolean;
  let sessionUsername: string | null;
  let controller: Controller;
  let project: Project;

  const createResult = (username: string, overrides: Partial<ProjectDistributionResult> = {}): ProjectDistributionResult =>
    ({
      username,
      project: { project_id: `copy-${username}`, name: `lab-${username}` } as Project,
      error: null,
      ...overrides,
    } as ProjectDistributionResult);

  const createJob = (overrides: Partial<ProjectDistribution> = {}): ProjectDistribution =>
    ({
      distribution_id: 'dist-1',
      project_id: 'proj-1',
      name: 'lab1',
      created_by: 'teacher',
      status: 'completed',
      total: 2,
      completed: 2,
      results: [createResult('alice'), createResult('bob')],
      error: null,
      ...overrides,
    } as ProjectDistribution);

  beforeEach(async () => {
    vi.clearAllMocks();
    isSuperadmin = false;
    sessionUsername = 'teacher';

    controller = {
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '127.0.0.1',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: 'teacher',
      password: '',
      tokenExpired: false,
    } as Controller;

    project = {
      project_id: 'proj-1',
      name: 'Lab',
      status: 'closed',
      created_by: 'teacher',
      frozen: true,
    } as Project;

    mockProjectService = {
      listDistributions: vi.fn().mockReturnValue(of([])),
      deleteDistribution: vi.fn(),
      deleteDistributionCopies: vi.fn(),
      unfreeze: vi.fn(),
    };

    mockToaster = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
      }),
    };

    mockDialogRef = { close: vi.fn() };

    const dialogData: DistributionHistoryDialogData = { controller, project };

    await TestBed.configureTestingModule({
      imports: [DistributionHistoryDialogComponent],
      providers: [
        provideRouter([]),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ToasterService, useValue: mockToaster },
        { provide: ProjectService, useValue: mockProjectService },
        {
          provide: PermissionService,
          useValue: {
            isSuperadmin: () => isSuperadmin,
            username: () => sessionUsername,
          },
        },
      ],
    })
      // The standalone component imports MatDialogModule itself, which
      // shadows TestBed providers inside its injector — override instead.
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .overrideProvider(MatDialogRef, { useValue: mockDialogRef })
      .compileComponents();

    fixture = TestBed.createComponent(DistributionHistoryDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('load', () => {
    it('should list the project distributions', () => {
      component.load();

      expect(mockProjectService.listDistributions).toHaveBeenCalledWith(controller, 'proj-1');
    });

    it('should keep the records from the response', () => {
      const job = createJob();
      mockProjectService.listDistributions.mockReturnValue(of([job]));

      component.load();

      expect(component.records()).toEqual([job]);
      expect(component.loadFailed()).toBe(false);
    });

    it('should flag a load failure', () => {
      mockProjectService.listDistributions.mockReturnValue(throwError(() => new Error('boom')));

      component.load();

      expect(component.loadFailed()).toBe(true);
    });
  });

  describe('liveCopies', () => {
    it('should count results whose copy still exists', () => {
      const job = createJob({
        results: [
          createResult('alice'),
          createResult('bob', { project_exists: false }),
          createResult('carol', { project: null, error: { message: 'quota exceeded' } }),
          createResult('dave', { project_exists: undefined }),
        ],
      });

      expect(component.liveCopies(job).map((result) => result.username)).toEqual(['alice', 'dave']);
    });

    it('should treat a missing project_exists flag as existing (older servers)', () => {
      const job = createJob({ results: [createResult('alice', { project_exists: undefined })] });

      expect(component.liveCopies(job)).toHaveLength(1);
    });
  });

  describe('canDeleteCopies', () => {
    it('should allow cleanup of a finished job with live copies', () => {
      expect(component.canDeleteCopies(createJob())).toBe(true);
    });

    it('should refuse a running job', () => {
      expect(component.canDeleteCopies(createJob({ status: 'running' }))).toBe(false);
    });

    it('should refuse a finished job whose copies are all gone', () => {
      const job = createJob({ results: [createResult('alice', { project_exists: false })] });

      expect(component.canDeleteCopies(job)).toBe(false);
    });
  });

  describe('recordDeleteTooltip', () => {
    it('should list the holders while a copy still exists', () => {
      expect(component.recordDeleteTooltip(createJob())).toBe(
        'Copies still exist (alice, bob): delete them before removing the record'
      );
    });

    it('should read plain when every copy is gone', () => {
      const job = createJob({ results: [createResult('alice', { project_exists: false })] });

      expect(component.recordDeleteTooltip(job)).toBe('Delete record');
    });
  });

  describe('deleteCopies', () => {
    it('should delete every live copy after confirmation and refresh the job in place', () => {
      const job = createJob();
      component.records.set([job]);
      const updated = createJob({
        results: [
          createResult('alice', { project_exists: false }),
          createResult('bob', { project_exists: false }),
        ],
      });
      mockProjectService.deleteDistributionCopies.mockReturnValue(of(updated));

      component.deleteCopies(job);

      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, expect.anything());
      expect(mockProjectService.deleteDistributionCopies).toHaveBeenCalledWith(controller, 'proj-1', 'dist-1');
      expect(component.records()).toEqual([updated]);
      expect(mockToaster.success).toHaveBeenCalledWith('Deleted 2 distributed copies.');
    });

    it('should do nothing when the job has no live copy left', () => {
      const job = createJob({ results: [createResult('alice', { project_exists: false })] });

      component.deleteCopies(job);

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockProjectService.deleteDistributionCopies).not.toHaveBeenCalled();
    });

    it('should not delete anything when the confirmation is dismissed', () => {
      mockDialog.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });

      component.deleteCopies(createJob());

      expect(mockProjectService.deleteDistributionCopies).not.toHaveBeenCalled();
    });

    it('should surface the server message when the cleanup fails', () => {
      mockProjectService.deleteDistributionCopies.mockReturnValue(
        throwError(() => new Error('The distribution is still running'))
      );

      component.deleteCopies(createJob());

      expect(mockToaster.error).toHaveBeenCalledWith('The distribution is still running');
    });

    it('should not throw when the records were reloaded while the cleanup was in flight', () => {
      // A concurrent action failed and triggered load() (records = null);
      // the cleanup response then lands late and must not map over null.
      component.records.set([createJob()]);
      const late = new Subject<ProjectDistribution>();
      mockProjectService.deleteDistributionCopies.mockReturnValue(late);

      component.deleteCopies(createJob());
      component.records.set(null);

      expect(() =>
        late.next(
          createJob({
            results: [
              createResult('alice', { project_exists: false }),
              createResult('bob', { project_exists: false }),
            ],
          })
        )
      ).not.toThrow();
      // The in-flight reload owns the state; the late response leaves it alone.
      expect(component.records()).toBeNull();
      expect(mockToaster.success).toHaveBeenCalledWith('Deleted 2 distributed copies.');
    });
  });

  describe('hasAnyLiveCopy', () => {
    it('should be true while the records are loading', () => {
      component.records.set(null);

      expect(component.hasAnyLiveCopy).toBe(true);
    });

    it('should be true when any job still has a live copy', () => {
      component.records.set([
        createJob({ distribution_id: 'dist-gone', results: [createResult('alice', { project_exists: false })] }),
        createJob(),
      ]);

      expect(component.hasAnyLiveCopy).toBe(true);
    });

    it('should be false once every copy is gone', () => {
      component.records.set([
        createJob({ results: [createResult('alice', { project_exists: false })] }),
        createJob({ distribution_id: 'dist-2', results: [] }),
      ]);

      expect(component.hasAnyLiveCopy).toBe(false);
    });
  });

  describe('canUnfreeze', () => {
    it('should be true for the template owner', () => {
      expect(component.canUnfreeze).toBe(true);
    });

    it('should be false for another user', () => {
      component.data.project = { ...project, created_by: 'someone-else' } as Project;

      expect(component.canUnfreeze).toBe(false);
    });

    it('should be true for a superadmin who is not the owner', () => {
      isSuperadmin = true;
      component.data.project = { ...project, created_by: 'someone-else' } as Project;

      expect(component.canUnfreeze).toBe(true);
    });

    it('should be false when the project is not frozen', () => {
      component.data.project = { ...project, frozen: false } as Project;

      expect(component.canUnfreeze).toBe(false);
    });
  });

  describe('unfreeze', () => {
    it('should refuse to open the confirmation while any copy is live', () => {
      component.records.set([createJob()]);

      component.unfreeze();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockProjectService.unfreeze).not.toHaveBeenCalled();
    });

    it('should unfreeze after confirmation and close the dialog with true', () => {
      component.records.set([createJob({ results: [createResult('alice', { project_exists: false })] })]);
      mockProjectService.unfreeze.mockReturnValue(of({ ...project, frozen: false }));

      component.unfreeze();

      expect(mockProjectService.unfreeze).toHaveBeenCalledWith(controller, 'proj-1');
      expect(mockToaster.success).toHaveBeenCalledWith('Project "Lab" unfrozen.');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should stay open and surface the 409 message when copies still exist', () => {
      component.records.set([]);
      mockProjectService.unfreeze.mockReturnValue(
        throwError(() => new Error('This distributed template still has 1 existing copy/copies (users: alice)'))
      );

      component.unfreeze();

      expect(mockToaster.error).toHaveBeenCalledWith(
        'This distributed template still has 1 existing copy/copies (users: alice)'
      );
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not unfreeze when the confirmation is dismissed', () => {
      component.records.set([]);
      mockDialog.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });

      component.unfreeze();

      expect(mockProjectService.unfreeze).not.toHaveBeenCalled();
    });
  });

  describe('removeJob', () => {
    it('should surface the 409 message when a record still has live copies', () => {
      mockProjectService.deleteDistribution.mockReturnValue(
        throwError(() => new Error('This distribution still has 1 existing copy/copies (users: bob)'))
      );
      mockProjectService.listDistributions.mockReturnValue(of([]));

      component.removeJob(createJob());

      expect(mockProjectService.listDistributions).toHaveBeenCalled(); // reload reflects the true state
      expect(mockToaster.error).toHaveBeenCalledWith('This distribution still has 1 existing copy/copies (users: bob)');
    });

    it('should not throw when the records were reloaded while the update was in flight', async () => {
      // One removeJob answered 204 (record deleted → load(), records =
      // null) while this one returns a cancelled job body: the late update
      // must not map over the null records.
      const late = new Subject<ProjectDistribution>();
      mockProjectService.deleteDistribution.mockReturnValue(late);

      component.removeJob(createJob());
      component.records.set(null);

      // RxJS rethrows observer exceptions on a macrotask; flushing it with
      // fake timers attributes such a crash to this test (real timers never
      // fire inside a zoneless TestBed).
      vi.useFakeTimers();
      try {
        late.next(createJob({ status: 'cancelled', completed: 1 }));
        await vi.advanceTimersByTimeAsync(0);
        expect(component.records()).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
