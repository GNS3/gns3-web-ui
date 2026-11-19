import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DistributeProjectDialogComponent } from './distribute-project-dialog.component';
import { ProjectService } from '@services/project.service';
import { ProjectDistributionService } from '@services/project-distribution.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project, ProjectDistribution } from '@models/project';

describe('DistributeProjectDialogComponent', () => {
  let fixture: ComponentFixture<DistributeProjectDialogComponent>;
  let component: DistributeProjectDialogComponent;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockDistributionService: any;
  let mockToasterService: any;
  let controller: Controller;
  let project: Project;

  const createJob = (overrides: Partial<ProjectDistribution> = {}): ProjectDistribution =>
    ({
      distribution_id: 'dist-1',
      project_id: 'proj-1',
      name: 'Lab',
      created_by: 'teacher',
      status: 'running',
      total: 1,
      completed: 0,
      results: [],
      error: null,
      ...overrides,
    } as ProjectDistribution);

  const createFixture = async () => {
    await TestBed.configureTestingModule({
      imports: [DistributeProjectDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ProjectDistributionService, useValue: mockDistributionService },
        {
          provide: UserService,
          useValue: {
            getGroupMembers: vi.fn().mockReturnValue(
              of({
                groups: [
                  { group_name: 'Class-1', members: ['student-01', 'student-02'] },
                ],
              })
            ),
          },
        },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DistributeProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = controller;
    component.project = project;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };
    mockProjectService = {
      distribute: vi.fn().mockReturnValue(of(createJob())),
      listDistributions: vi.fn().mockReturnValue(of([])),
    };
    mockDistributionService = { track: vi.fn() };
    mockToasterService = { success: vi.fn(), error: vi.fn() };

    controller = { id: 1, username: 'teacher' } as unknown as Controller;
    project = { project_id: 'proj-1', name: 'Lab', status: 'closed', created_by: 'teacher' } as unknown as Project;

    await createFixture();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('seeds the copy name from the project', () => {
    expect(component.copyName()).toBe('Lab');
  });

  it('adopts running jobs found in the project list on open', () => {
    const running = createJob({ distribution_id: 'dist-running' });
    const finished = createJob({ distribution_id: 'dist-done', status: 'completed' });
    mockProjectService.listDistributions.mockReturnValue(of([finished, running]));
    (component as unknown as { ngOnInit: () => void }).ngOnInit();

    expect(mockDistributionService.track).toHaveBeenCalledTimes(1);
    expect(mockDistributionService.track).toHaveBeenCalledWith(controller, running);
  });

  it('requires a copy name', () => {
    component.selectUser('student-01');
    component.copyName.set('   ');

    expect(component.canSubmit()).toBe(false);
  });

  it('submits a single-user distribution with MAC reset by default', () => {
    component.selectUser('student-01');
    component.onSubmitClick();

    expect(mockProjectService.distribute).toHaveBeenCalledWith(controller, 'proj-1', 'Lab', {
      target_user: 'student-01',
      reset_mac_addresses: true,
      lock_topology: true,
    });
  });

  it('submits one target entry per chip in multiple-users mode', () => {
    component.targetMode.set('users');
    component.addUser('student-01');
    component.addUser('student-02');
    component.copyName.set('Homework');
    component.onSubmitClick();

    expect(mockProjectService.distribute).toHaveBeenCalledWith(controller, 'proj-1', 'Homework', {
      target_users: ['student-01', 'student-02'],
      reset_mac_addresses: true,
      lock_topology: true,
    });
  });

  it('submits a group distribution without a username suffix hint', () => {
    component.targetMode.set('group');
    component.selectGroup('Students');
    component.onSubmitClick();

    expect(mockProjectService.distribute).toHaveBeenCalledWith(controller, 'proj-1', 'Lab', {
      target_group: 'Students',
      reset_mac_addresses: true,
      lock_topology: true,
    });
    expect(component.nameGetsSuffix()).toBe(true);
  });

  it('keeps MAC addresses when the checkbox is cleared', () => {
    component.selectUser('student-01');
    component.resetMacAddresses.set(false);
    component.onSubmitClick();

    expect(mockProjectService.distribute).toHaveBeenCalledWith(controller, 'proj-1', 'Lab', {
      target_user: 'student-01',
      reset_mac_addresses: false,
      lock_topology: true,
    });
  });

  it('leaves the copy topology editable when the lock checkbox is cleared', () => {
    component.selectUser('student-01');
    component.lockTopology.set(false);
    component.onSubmitClick();

    expect(mockProjectService.distribute).toHaveBeenCalledWith(controller, 'proj-1', 'Lab', {
      target_user: 'student-01',
      reset_mac_addresses: true,
      lock_topology: false,
    });
  });

  it('tracks the returned job and closes on 202', () => {
    const job = createJob({ total: 3 });
    mockProjectService.distribute.mockReturnValue(of(job));
    component.selectUser('student-01');
    component.onSubmitClick();

    expect(mockDistributionService.track).toHaveBeenCalledWith(controller, job);
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('toasts and stays open when distribution is rejected', () => {
    mockProjectService.distribute.mockReturnValue(throwError(() => new Error('target user missing')));
    component.selectUser('student-01');
    component.onSubmitClick();

    expect(mockToasterService.error).toHaveBeenCalledWith('target user missing');
    expect(component.isSubmitting()).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
