import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetailDialogComponent, UserDetailDialogData } from './user-detail-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { AclService } from '@services/acl.service';
import { RoleService } from '@services/role.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { ACE, ACEDetailed } from '@models/api/ACE';
import { Endpoint } from '@models/api/endpoint';
import { Role } from '@models/api/role';
import { of, throwError } from 'rxjs';

describe('UserDetailDialogComponent', () => {
  let component: UserDetailDialogComponent;
  let fixture: ComponentFixture<UserDetailDialogComponent>;
  let mockUserService: Partial<UserService>;
  let mockToasterService: Partial<ToasterService>;
  let mockAclService: Partial<AclService>;
  let mockRoleService: Partial<RoleService>;
  let mockDialog: MatDialog;
  let mockDialogRef: MatDialogRef<UserDetailDialogComponent>;

  const mockUser: User = {
    user_id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    is_active: true,
    is_superadmin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    last_login: '2024-01-03',
  };

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'test-token',
    tokenExpired: false,
    location: 'local',
    path: '/',
    ubridge_path: '/usr/local/bin/ubridge',
    status: 'running',
    username: 'admin',
    password: 'password',
  };

  const mockGroups: Group[] = [
    { user_group_id: 'group-1', name: 'Admins', created_at: '', updated_at: '', is_builtin: false },
    { user_group_id: 'group-2', name: 'Users', created_at: '', updated_at: '', is_builtin: false },
  ];

  const mockRoles: Role[] = [
    { role_id: 'role-1', name: 'Admin', description: '', created_at: '', updated_at: '', is_builtin: false, privileges: [] },
    { role_id: 'role-2', name: 'Viewer', description: '', created_at: '', updated_at: '', is_builtin: false, privileges: [] },
  ];

  const mockEndpoints: Endpoint[] = [
    { endpoint: '/api/test', name: 'Test API', endpoint_type: 'project' as any },
  ];

  const mockAces: ACE[] = [
    { ace_id: 'ace-1', ace_type: 'user' as any, user_id: 'user-123', role_id: 'role-1', path: '/api/test', propagate: true, allowed: true, created_at: '', updated_at: '' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUserService = {
      getGroupsByUserId: vi.fn().mockReturnValue(of(mockGroups)),
      update: vi.fn().mockReturnValue(of(mockUser)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockAclService = {
      getEndpoints: vi.fn().mockReturnValue(of(mockEndpoints)),
      list: vi.fn().mockReturnValue(of(mockAces)),
    };

    mockRoleService = {
      get: vi.fn().mockReturnValue(of(mockRoles)),
    };

    mockDialogRef = {
      close: vi.fn(),
      afterClosed: vi.fn().mockReturnValue(of(null)),
    } as any;

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
    } as any;

    const dialogData: UserDetailDialogData = {
      user: mockUser,
      controller: mockController,
    };

    await TestBed.configureTestingModule({
      imports: [
        UserDetailDialogComponent,
        MatDialogModule,
        MatTableModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserService, useValue: mockUserService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: AclService, useValue: mockAclService },
        { provide: RoleService, useValue: mockRoleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call initForm, loadGroupsData, and loadAceData', () => {
      const initFormSpy = vi.spyOn(component, 'initForm');
      const loadGroupsDataSpy = vi.spyOn(component, 'loadGroupsData');
      const loadAceDataSpy = vi.spyOn(component, 'loadAceData');

      component.ngOnInit();

      expect(initFormSpy).toHaveBeenCalled();
      expect(loadGroupsDataSpy).toHaveBeenCalled();
      expect(loadAceDataSpy).toHaveBeenCalled();
    });
  });

  describe('initForm', () => {
    it('should create form with username field', () => {
      component.ngOnInit();
      expect(component.editUserForm.get('username')).toBeTruthy();
    });

    it('should create form with email field', () => {
      component.ngOnInit();
      expect(component.editUserForm.get('email')).toBeTruthy();
    });

    it('should create form with full_name field', () => {
      component.ngOnInit();
      expect(component.editUserForm.get('full_name')).toBeTruthy();
    });

    it('should create form with is_active field', () => {
      component.ngOnInit();
      expect(component.editUserForm.get('is_active')).toBeTruthy();
    });

    it('should populate form with user data', () => {
      component.ngOnInit();
      expect(component.editUserForm.get('username')?.value).toBe(mockUser.username);
      expect(component.editUserForm.get('email')?.value).toBe(mockUser.email);
      expect(component.editUserForm.get('full_name')?.value).toBe(mockUser.full_name);
      expect(component.editUserForm.get('is_active')?.value).toBe(mockUser.is_active);
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      component.ngOnInit();
      const form = component.form;
      expect(form.username).toBeDefined();
      expect(form.email).toBeDefined();
      expect(form.full_name).toBeDefined();
      expect(form.is_active).toBeDefined();
    });
  });

  describe('loadGroupsData', () => {
    it('should load groups from service', () => {
      component.ngOnInit();
      expect(mockUserService.getGroupsByUserId).toHaveBeenCalledWith(mockController, mockUser.user_id);
    });

    it('should set groups and groupsLoaded on success', () => {
      component.ngOnInit();
      expect(component.groups).toEqual(mockGroups);
      expect(component.groupsLoaded).toBe(true);
    });

    it('should set groupsLoaded to true on error', () => {
      (mockUserService.getGroupsByUserId as ReturnType<typeof vi.fn>).mockReturnValue(
        throwError(() => new Error('Failed to load groups'))
      );
      component.loadGroupsData();
      expect(component.groupsLoaded).toBe(true);
    });
  });

  describe('loadAceData', () => {
    it('should load roles and endpoints', () => {
      component.ngOnInit();
      expect(mockRoleService.get).toHaveBeenCalledWith(mockController);
      expect(mockAclService.getEndpoints).toHaveBeenCalledWith(mockController);
    });

    it('should filter ACEs for current user', () => {
      component.ngOnInit();
      expect(component.aces).toHaveLength(1);
      expect(component.aces[0].user_id).toBe(mockUser.user_id);
    });

    it('should set acesLoaded to true on success', () => {
      component.ngOnInit();
      expect(component.acesLoaded).toBe(true);
    });

    it('should set acesLoaded to true on error', () => {
      (mockAclService.list as ReturnType<typeof vi.fn>).mockReturnValue(
        throwError(() => new Error('Failed to load ACEs'))
      );
      component.loadAceData();
      expect(component.acesLoaded).toBe(true);
    });

    it('should map ACEs with endpoint_name and role_name', () => {
      component.ngOnInit();
      expect(component.aceDatasource.data[0].endpoint_name).toBe('Test API');
      expect(component.aceDatasource.data[0].role_name).toBe('Admin');
    });
  });

  describe('getUpdatedValues', () => {
    it('should return empty object when no values changed', () => {
      component.ngOnInit();
      const result = component.getUpdatedValues();
      expect(result).toEqual({});
    });

    it('should return only dirty values that differ from original', () => {
      component.ngOnInit();
      component.editUserForm.get('full_name')?.setValue('New Name');
      component.editUserForm.get('full_name')?.markAsDirty();

      const result = component.getUpdatedValues();
      expect(result).toEqual({ full_name: 'New Name' });
    });
  });

  describe('onSaveChanges', () => {
    it('should not call update if form is invalid', () => {
      component.ngOnInit();
      component.editUserForm.get('username')?.setValue(''); // Invalid: required
      component.onSaveChanges();
      expect(mockUserService.update).not.toHaveBeenCalled();
    });

    it('should call userService.update with correct data', () => {
      component.ngOnInit();
      component.editUserForm.get('full_name')?.setValue('Updated Name');
      component.editUserForm.get('full_name')?.markAsDirty();
      component.onSaveChanges();

      expect(mockUserService.update).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({ full_name: 'Updated Name' }),
        false
      );
    });

    it('should close dialog and show success toast on update success', () => {
      component.ngOnInit();
      component.editUserForm.get('full_name')?.setValue('Updated Name');
      component.editUserForm.get('full_name')?.markAsDirty();
      component.onSaveChanges();

      expect(mockToasterService.success).toHaveBeenCalledWith(`User ${mockUser.username} updated`);
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockUser);
    });

    it('should show error toast on update failure', () => {
      (mockUserService.update as ReturnType<typeof vi.fn>).mockReturnValue(
        throwError(() => new Error('Update failed'))
      );
      component.ngOnInit();
      component.editUserForm.get('full_name')?.setValue('Updated Name');
      component.editUserForm.get('full_name')?.markAsDirty();
      component.onSaveChanges();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot update user : Error: Update failed');
    });
  });

  describe('onChangePassword', () => {
    it('should open change password dialog', () => {
      component.ngOnInit();
      component.onChangePassword();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.ngOnInit();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('UserDetailDialogData interface', () => {
    it('should accept valid user and controller data', () => {
      const data: UserDetailDialogData = {
        user: mockUser,
        controller: mockController,
      };
      expect(data.user).toEqual(mockUser);
      expect(data.controller).toEqual(mockController);
    });
  });
});
