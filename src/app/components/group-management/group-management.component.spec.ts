import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GroupManagementComponent } from './group-management.component';
import { GroupService } from '@services/group.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { GroupFilterPipe } from '@filters/group-filter.pipe';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';

describe('GroupManagementComponent', () => {
  let component: GroupManagementComponent;
  let fixture: ComponentFixture<GroupManagementComponent>;
  let mockGroupService: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockChangeDetectorRef: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'test-token',
    tokenExpired: false,
    location: 'local' as const,
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    status: 'running' as const,
    username: 'admin',
    password: 'password',
  };

  const createMockGroup = (overrides: Partial<Group> = {}): Group =>
    ({
      name: 'Test Group',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      user_group_id: 'group-1',
      is_builtin: false,
      ...overrides,
    } as Group);

  const mockActivatedRoute = {
    parent: {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialog = {
      open: vi.fn(),
    };

    mockGroupService = {
      getGroups: vi
        .fn()
        .mockReturnValue(of([createMockGroup(), createMockGroup({ user_group_id: 'group-2', name: 'Admin' })])),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        GroupManagementComponent,
        MatDialogModule,
        MatTableModule,
        MatCheckboxModule,
        MatSortModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        GroupFilterPipe,
        RouterModule,
      ],
      providers: [
        { provide: GroupService, useValue: mockGroupService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have dataSource', () => {
      expect(component.dataSource).toBeDefined();
    });

    it('should have selection model', () => {
      expect(component.selection).toBeDefined();
    });

    it('should have displayedColumns with required columns', () => {
      expect(component.displayedColumns()).toContain('select');
      expect(component.displayedColumns()).toContain('name');
      expect(component.displayedColumns()).toContain('actions');
    });
  });

  describe('initialization', () => {
    it('should load controller and groups on init', () => {
      expect(mockControllerService.get).toHaveBeenCalledWith(1);
      expect(mockGroupService.getGroups).toHaveBeenCalledWith(mockController);
    });

    it('should set isReady signal to true after groups are loaded', () => {
      expect(component.isReady()).toBe(true);
    });

    it('should populate groups array and dataSource after loading', () => {
      expect(component.groups).toBeDefined();
      expect(component.groups.length).toBe(2);
      expect(component.dataSource.data.length).toBe(2);
    });

    it('should clear selection after loading groups', () => {
      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('isAllSelected', () => {
    it('should return true when all groups are selected', () => {
      component.groups = [createMockGroup({ user_group_id: '1' }), createMockGroup({ user_group_id: '2' })];
      component.selection.select(component.groups[0], component.groups[1]);
      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when only some groups are selected', () => {
      component.groups = [createMockGroup({ user_group_id: '1' }), createMockGroup({ user_group_id: '2' })];
      component.selection.select(component.groups[0]);
      expect(component.isAllSelected()).toBe(false);
    });

    it('should return false when no groups are selected', () => {
      component.groups = [createMockGroup({ user_group_id: '1' }), createMockGroup({ user_group_id: '2' })];
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('masterToggle', () => {
    it('should select all groups when none are selected', () => {
      component.groups = [createMockGroup({ user_group_id: '1' }), createMockGroup({ user_group_id: '2' })];
      component.masterToggle();
      expect(component.selection.selected.length).toBe(2);
    });

    it('should clear selection when all groups are selected', () => {
      component.groups = [createMockGroup({ user_group_id: '1' }), createMockGroup({ user_group_id: '2' })];
      component.selection.select(component.groups[0], component.groups[1]);
      component.masterToggle();
      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should fetch groups from service', () => {
      component.controller = mockController;
      component.refresh();
      expect(mockGroupService.getGroups).toHaveBeenCalledWith(mockController);
    });

    it('should set isReady to true after refresh', () => {
      component.controller = mockController;
      component.isReady.set(false);
      component.refresh();
      expect(component.isReady()).toBe(true);
    });

    it('should clear selection after refresh', () => {
      component.controller = mockController;
      component.selection.select(component.groups[0]);
      component.refresh();
      expect(component.selection.isEmpty()).toBe(true);
    });
  });

  describe('addGroup', () => {
    it('should be defined', () => {
      expect(component.addGroup).toBeDefined();
    });
  });

  describe('onDelete', () => {
    it('should be defined', () => {
      expect(component.onDelete).toBeDefined();
    });
  });

  describe('openGroupDetailDialog', () => {
    it('should be defined', () => {
      expect(component.openGroupDetailDialog).toBeDefined();
    });
  });

  describe('openGroupAiProfileDialog', () => {
    it('should be defined', () => {
      expect(component.openGroupAiProfileDialog).toBeDefined();
    });
  });

  describe('ngOnInit error handling', () => {
    it('should display error when controllerService.get fails', async () => {
      mockControllerService.get.mockRejectedValue({ error: { message: 'Controller not found' } });
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller not found');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback error message when no message available', async () => {
      mockControllerService.get.mockRejectedValue({ code: 'INTERNAL_ERROR' });
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('refresh error handling', () => {
    it('should display error when getGroups fails', () => {
      component.controller = mockController;
      mockGroupService.getGroups.mockReturnValue(throwError(() => ({ error: { message: 'Load failed' } })));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('Load failed');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should use fallback error message when getGroups fails with no message', () => {
      component.controller = mockController;
      mockGroupService.getGroups.mockReturnValue(throwError(() => ({})));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.refresh();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load groups');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
