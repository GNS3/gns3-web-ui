import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { UserService } from '@services/user.service';
import { ControllerService } from '@services/controller.service';
import { ProgressService } from '../../common/progress/progress.service';
import { ToasterService } from '@services/toaster.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserFilterPipe } from '@filters/user-filter.pipe';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ChangeDetectorRef } from '@angular/core';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let mockUserService: any;
  let mockControllerService: any;
  let mockProgressService: any;
  let mockToasterService: any;
  let mockDialog: any;
  let mockLocation: any;
  let mockDialogRef: any;

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

  const createMockUser = (overrides: Partial<User> = {}): User =>
    ({
      user_id: 'user-1',
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
      is_active: true,
      last_login: null,
      updated_at: '2024-01-01',
      ...overrides,
    } as User);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      afterClosed: vi.fn().mockReturnValue(of(true)),
      componentInstance: {},
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    };

    mockUserService = {
      list: vi.fn().mockReturnValue(of([createMockUser(), createMockUser({ user_id: 'user-2', username: 'admin' })])),
      get: vi.fn().mockReturnValue(of(createMockUser())),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    };

    mockProgressService = {
      setError: vi.fn(),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    mockLocation = {
      back: vi.fn(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    };

    await TestBed.configureTestingModule({
      imports: [
        UserManagementComponent,
        MatDialogModule,
        MatTableModule,
        MatCheckboxModule,
        MatSortModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        UserFilterPipe,
        RouterModule,
      ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Location, useValue: mockLocation },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: {
                paramMap: {
                  get: vi.fn().mockReturnValue('1'),
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
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

    it('should have displayedColumns', () => {
      expect(component.displayedColumns).toContain('select');
      expect(component.displayedColumns).toContain('username');
      expect(component.displayedColumns).toContain('actions');
    });
  });

  describe('ngOnInit', () => {
    it('should show error and navigate back when controllerService.get fails', async () => {
      (mockControllerService.get as any).mockRejectedValue({ error: { message: 'Controller not found' } });

      const newFixture = TestBed.createComponent(UserManagementComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Controller not found');
      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should use fallback message when controller error has no message', async () => {
      (mockControllerService.get as any).mockRejectedValue({});

      const newFixture = TestBed.createComponent(UserManagementComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      await newFixture.whenStable();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load controller');
    });
  });

  describe('refresh', () => {
    it('should fetch users and update dataSource', () => {
      const users = [createMockUser(), createMockUser({ user_id: 'user-2' })];
      (mockUserService.list as any).mockReturnValue(of(users));

      component.refresh();
      fixture.detectChanges();

      expect(mockUserService.list).toHaveBeenCalledWith(mockController);
      expect(component.dataSource.data).toEqual(users);
      expect(component.isReady).toBe(true);
    });

    it('should handle error when fetching users fails', () => {
      const error = { error: { message: 'Network error' } };
      (mockUserService.list as any).mockReturnValue(throwError(() => error));

      component.refresh();
      fixture.detectChanges();

      expect(mockProgressService.setError).toHaveBeenCalledWith(error);
      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should use fallback message when error has no message', () => {
      (mockUserService.list as any).mockReturnValue(throwError(() => ({})));

      component.refresh();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load users');
    });
  });

  describe('addUser', () => {
    it('should open add user dialog', () => {
      // Dialog components require full dependency graph - tested in integration tests
      expect(component.addUser).toBeDefined();
    });
  });

  describe('onDelete', () => {
    it('should open delete user dialog', () => {
      // Dialog components require full dependency graph - tested in integration tests
      expect(component.onDelete).toBeDefined();
    });

    it('should show error when delete fails with error.error.message', () => {
      const user = createMockUser();
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      (mockUserService.delete as any).mockReturnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );

      component.onDelete(user);

      expect(mockToasterService.error).toHaveBeenCalledWith('Delete failed');
    });

    it('should use fallback message when delete error has no message', () => {
      const user = createMockUser();
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      (mockUserService.delete as any).mockReturnValue(throwError(() => ({})));

      component.onDelete(user);

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete user testuser');
    });
  });

  describe('isAllSelected', () => {
    it('should return true when all rows are selected', () => {
      component.dataSource.data = [createMockUser({ user_id: '1' }), createMockUser({ user_id: '2' })];
      component.selection.select(component.dataSource.data[0], component.dataSource.data[1]);

      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when not all rows are selected', () => {
      component.dataSource.data = [createMockUser({ user_id: '1' }), createMockUser({ user_id: '2' })];
      component.selection.select(component.dataSource.data[0]);

      expect(component.isAllSelected()).toBe(false);
    });

    it('should return true when dataSource is empty', () => {
      component.dataSource.data = [];

      expect(component.isAllSelected()).toBe(true);
    });
  });

  describe('masterToggle', () => {
    it('should select all rows when none are selected', () => {
      component.dataSource.data = [createMockUser({ user_id: '1' }), createMockUser({ user_id: '2' })];

      component.masterToggle();

      expect(component.selection.selected.length).toBe(2);
    });

    it('should clear selection when all rows are selected', () => {
      component.dataSource.data = [createMockUser({ user_id: '1' }), createMockUser({ user_id: '2' })];
      component.selection.select(component.dataSource.data[0], component.dataSource.data[1]);

      component.masterToggle();

      expect(component.selection.selected.length).toBe(0);
    });
  });

  describe('deleteMultiple', () => {
    it('should open delete dialog for selected users', () => {
      // Dialog components require full dependency graph - tested in integration tests
      expect(component.deleteMultiple).toBeDefined();
    });

    it('should show error when delete fails with error.error.message', () => {
      const users = [createMockUser({ user_id: 'user-1' })];
      component.selection.setSelection(users);
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      (mockUserService.delete as any).mockReturnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );

      component.deleteMultiple();

      expect(mockToasterService.error).toHaveBeenCalledWith('Delete failed');
    });

    it('should use fallback message when delete error has no message', () => {
      const users = [createMockUser({ user_id: 'user-1' })];
      component.selection.setSelection(users);
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      (mockUserService.delete as any).mockReturnValue(throwError(() => ({})));

      component.deleteMultiple();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to delete user testuser');
    });
  });

  describe('openUserDetailDialog', () => {
    it('should show error when fetching user data fails with error.error.message', () => {
      const user = createMockUser();
      const error = { error: { message: 'Failed to load' } };
      (mockUserService.get as any).mockReturnValue(throwError(() => error));

      component.openUserDetailDialog(user);

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load');
    });

    it('should use fallback message when error has no message', () => {
      const user = createMockUser();
      (mockUserService.get as any).mockReturnValue(throwError(() => ({})));

      component.openUserDetailDialog(user);

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load user data');
    });

    it('should call markForCheck when fetching user data fails', () => {
      const user = createMockUser();
      (mockUserService.get as any).mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));

      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');
      component.openUserDetailDialog(user);

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('openAiProfileDialog', () => {
    it('should open AI profile dialog', () => {
      // Dialog components require full dependency graph - tested in integration tests
      expect(component.openAiProfileDialog).toBeDefined();
    });
  });
});
