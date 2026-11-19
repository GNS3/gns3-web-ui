import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShareProjectDialogComponent } from './share-project-dialog.component';
import { ProjectService } from '@services/project.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Project, ProjectShare } from '@models/project';

describe('ShareProjectDialogComponent', () => {
  let fixture: ComponentFixture<ShareProjectDialogComponent>;
  let component: ShareProjectDialogComponent;
  let mockDialogRef: any;
  let mockProjectService: any;
  let mockToasterService: any;
  let controller: Controller;
  let project: Project;

  const createShare = (overrides: Partial<ProjectShare> = {}): ProjectShare =>
    ({ ace_id: 'ace-1', username: 'student-01', group_name: null, role: 'Lab member', created_at: '', updated_at: '', ...overrides } as ProjectShare);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = { close: vi.fn() };
    mockProjectService = {
      share: vi.fn().mockReturnValue(of([createShare()])),
      listShares: vi.fn().mockReturnValue(of([createShare()])),
      removeShare: vi.fn().mockReturnValue(of(undefined)),
    };
    mockToasterService = { success: vi.fn(), error: vi.fn() };

    controller = { id: 1, username: 'teacher' } as unknown as Controller;
    project = { project_id: 'proj-1', name: 'Lab', status: 'closed', created_by: 'teacher' } as unknown as Project;

    await TestBed.configureTestingModule({
      imports: [ShareProjectDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProjectService, useValue: mockProjectService },
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

    fixture = TestBed.createComponent(ShareProjectDialogComponent);
    component = fixture.componentInstance;
    component.controller = controller;
    component.project = project;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('loads the current shares on open', () => {
    expect(mockProjectService.listShares).toHaveBeenCalledWith(controller, 'proj-1');
    expect(component.shares().length).toBe(1);
    expect(component.isLoadingShares()).toBe(false);
  });

  it('surfaces a load failure without breaking the form', () => {
    mockProjectService.listShares.mockReturnValue(throwError(() => new Error('boom')));

    (component as unknown as { loadShares: () => void }).loadShares();

    expect(component.sharesLoadError()).toBe('boom');
    expect(component.isLoadingShares()).toBe(false);
  });

  it('disables submit until a target is picked', () => {
    expect(component.canSubmit()).toBe(false);

    component.selectUser('student-01');

    expect(component.canSubmit()).toBe(true);
  });

  it('requires at least one chip in multiple-users mode', () => {
    component.targetMode.set('users');

    expect(component.canSubmit()).toBe(false);

    component.addUser('student-01');

    expect(component.canSubmit()).toBe(true);
  });

  it('submits a single-user share with the default role', () => {
    component.selectUser('student-01');
    component.onSubmitClick();

    expect(mockProjectService.share).toHaveBeenCalledWith(controller, 'proj-1', {
      target_user: 'student-01',
      role: 'Lab member',
    });
  });

  it('submits every chip in multiple-users mode', () => {
    component.targetMode.set('users');
    component.addUser('student-01');
    component.addUser('student-02');
    component.onSubmitClick();

    expect(mockProjectService.share).toHaveBeenCalledWith(controller, 'proj-1', {
      target_users: ['student-01', 'student-02'],
      role: 'Lab member',
    });
  });

  it('submits a group share with the selected role', () => {
    component.targetMode.set('group');
    component.selectGroup('Students');
    component.role.set('User');
    component.onSubmitClick();

    expect(mockProjectService.share).toHaveBeenCalledWith(controller, 'proj-1', {
      target_group: 'Students',
      role: 'User',
    });
  });

  it('toasts, reloads the list and resets the form on success — dialog stays open', () => {
    component.selectUser('student-01');
    mockProjectService.listShares.mockClear();
    component.onSubmitClick();

    expect(mockToasterService.success).toHaveBeenCalledWith(expect.stringContaining('student-01'));
    expect(mockProjectService.listShares).toHaveBeenCalledTimes(1);
    expect(component.selectedUser()).toBeNull();
    expect(component.userFilter()).toBe('');
    expect(component.isSubmitting()).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('toasts and keeps the form when sharing fails', () => {
    mockProjectService.share.mockReturnValue(throwError(() => new Error('empty group')));
    component.selectUser('student-01');
    component.onSubmitClick();

    expect(mockToasterService.error).toHaveBeenCalledWith('empty group');
    expect(component.isSubmitting()).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('removes a share and updates the list', () => {
    const share = createShare();
    component.shares.set([share]);

    component.removeShare(share);

    expect(mockProjectService.removeShare).toHaveBeenCalledWith(controller, 'proj-1', 'ace-1');
    expect(component.shares().length).toBe(0);
    expect(component.removingAceId()).toBeNull();
  });

  it('toasts and keeps the row when removal fails', () => {
    mockProjectService.removeShare.mockReturnValue(throwError(() => new Error('denied')));
    const share = createShare();
    component.shares.set([share]);

    component.removeShare(share);

    expect(mockToasterService.error).toHaveBeenCalledWith('denied');
    expect(component.shares().length).toBe(1);
    expect(component.removingAceId()).toBeNull();
  });

  it('ignores removal clicks while another removal is in flight', () => {
    const share = createShare();
    component.shares.set([share]);
    component.removingAceId.set('ace-1');

    component.removeShare(share);

    expect(mockProjectService.removeShare).not.toHaveBeenCalled();
  });
});
