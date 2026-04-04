import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { GroupDetailDialogComponent, GroupDetailDialogData } from './group-detail-dialog.component';
import { GroupService } from '@services/group.service';
import { AclService } from '@services/acl.service';
import { RoleService } from '@services/role.service';
import { ToasterService } from '@services/toaster.service';
import { Group } from '@models/groups/group';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { ACE, ACEDetailed } from '@models/api/ACE';
import { Role } from '@models/api/role';
import { Endpoint } from '@models/api/endpoint';
import { AddUserToGroupDialogComponent } from '@components/group-details/add-user-to-group-dialog/add-user-to-group-dialog.component';
import { RemoveToGroupDialogComponent } from '@components/group-details/remove-to-group-dialog/remove-to-group-dialog.component';
import { UserDetailDialogComponent } from '@components/user-management/user-detail-dialog/user-detail-dialog.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('GroupDetailDialogComponent', () => {
  let component: GroupDetailDialogComponent;
  let fixture: ComponentFixture<GroupDetailDialogComponent>;
  let mockDialogRef: any;
  let mockDialog: any;
  let mockGroupService: any;
  let mockAclService: any;
  let mockRoleService: any;
  let mockToastService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockGroup: Group;
  let addUserDialogRef: any;
  let removeUserDialogRef: any;
  let userDetailDialogRef: any;
  let addUserClosed$: Subject<boolean>;
  let removeUserClosed$: Subject<boolean>;

  const createMockUser = (userId: string, username: string): User => ({
    user_id: userId,
    username,
    email: `${username}@test.com`,
    full_name: 'Test User',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
  });

  const createMockGroup = (): Group => ({
    name: 'TestGroup',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    user_group_id: 'group-uuid-123',
    is_builtin: false,
  });

  const createMockController = (): Controller => ({
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: '192.168.1.100',
    port: 3080,
    protocol: 'http:',
    status: 'running',
    authToken: 'token',
    path: '',
    ubridge_path: '',
    username: '',
    password: '',
    tokenExpired: false,
  });

  const createMockRole = (roleId: string, name: string): Role => ({
    role_id: roleId,
    name,
    description: 'Test role',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    is_builtin: false,
    privileges: [],
  });

  const createMockEndpoint = (endpoint: string, name: string): Endpoint => ({
    endpoint,
    name,
    endpoint_type: 'project' as any,
  });

  beforeEach(async () => {
    addUserClosed$ = new Subject<boolean>();
    removeUserClosed$ = new Subject<boolean>();

    addUserDialogRef = {
      close: vi.fn(),
      afterClosed: () => addUserClosed$.asObservable(),
    };

    removeUserDialogRef = {
      close: vi.fn(),
      afterClosed: () => removeUserClosed$.asObservable(),
    };

    userDetailDialogRef = {
      close: vi.fn(),
      afterClosed: () => of(null),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockImplementation((componentType) => {
        if (componentType === AddUserToGroupDialogComponent) {
          return addUserDialogRef;
        }
        if (componentType === RemoveToGroupDialogComponent) {
          return removeUserDialogRef;
        }
        if (componentType === UserDetailDialogComponent) {
          return userDetailDialogRef;
        }
        return addUserDialogRef;
      }),
    };

    mockGroupService = {
      getGroupMember: vi.fn().mockReturnValue(of([])),
      update: vi.fn().mockReturnValue(of({})),
      removeUser: vi.fn().mockReturnValue(of({})),
    };

    mockAclService = {
      getEndpoints: vi.fn().mockReturnValue(of([])),
      list: vi.fn().mockReturnValue(of([])),
    };

    mockRoleService = {
      get: vi.fn().mockReturnValue(of([])),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockGroup = createMockGroup();
    mockController = createMockController();

    const dialogData: GroupDetailDialogData = {
      group: mockGroup,
      controller: mockController,
    };

    await TestBed.configureTestingModule({
      imports: [GroupDetailDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialog, useValue: mockDialog },
        { provide: GroupService, useValue: mockGroupService },
        { provide: AclService, useValue: mockAclService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: ToasterService, useValue: mockToastService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupDetailDialogComponent);
    component = fixture.componentInstance;

    // Replace the component's dialog with our mock
    component['dialog'] = mockDialog;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    addUserClosed$.complete();
    removeUserClosed$.complete();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with members signal as empty array', () => {
      expect(component.members()).toEqual([]);
    });

    it('should initialize with empty aces array', () => {
      expect(component.aces).toEqual([]);
    });

    it('should initialize aceDatasource as MatTableDataSource', () => {
      expect(component.aceDatasource).toBeInstanceOf(MatTableDataSource);
    });

    it('should initialize searchMembers as empty string', () => {
      expect(component.searchMembers).toBe('');
    });

    it('should set aceDisplayedColumns with correct columns', () => {
      expect(component.aceDisplayedColumns).toEqual(['endpoint', 'role', 'propagate', 'allowed']);
    });
  });

  describe('ngOnInit', () => {
    it('should create editGroupForm with groupname control', () => {
      expect(component.editGroupForm).toBeDefined();
      expect(component.editGroupForm.get('groupname')).toBeDefined();
    });

    it('should set groupname control value to group name', () => {
      expect(component.editGroupForm.get('groupname')?.value).toBe(mockGroup.name);
    });

    it('should require groupname to be non-empty', () => {
      const control = component.editGroupForm.get('groupname');
      control?.setValue('');
      expect(control?.valid).toBe(false);
      control?.setValue('NewName');
      expect(control?.valid).toBe(true);
    });

    it('should call loadMembers', () => {
      expect(mockGroupService.getGroupMember).toHaveBeenCalledWith(mockController, mockGroup.user_group_id);
    });

    it('should call loadAces', () => {
      expect(mockRoleService.get).toHaveBeenCalledWith(mockController);
    });
  });

  describe('loadMembers', () => {
    it('should load and sort members alphabetically by username', () => {
      const unsortedUsers = [
        createMockUser('1', 'Zack'),
        createMockUser('2', 'Alice'),
        createMockUser('3', 'Bob'),
      ];
      mockGroupService.getGroupMember.mockReturnValue(of(unsortedUsers));

      component.loadMembers();

      const sortedMembers = component.members();
      expect(sortedMembers[0].username).toBe('Alice');
      expect(sortedMembers[1].username).toBe('Bob');
      expect(sortedMembers[2].username).toBe('Zack');
    });

    it('should handle error when loading members fails', () => {
      mockGroupService.getGroupMember.mockReturnValue(throwError(() => new Error('Load failed')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.loadMembers();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadAces', () => {
    it('should load ACEs and map endpoint names and role names', () => {
      const roles = [createMockRole('role1', 'Admin')];
      const endpoints = [createMockEndpoint('/api/test', 'Test API')];
      const aces: ACE[] = [
        {
          ace_id: 'ace1',
          ace_type: 'group' as any,
          group_id: mockGroup.user_group_id,
          path: '/api/test',
          role_id: 'role1',
          propagate: true,
          allowed: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockRoleService.get.mockReturnValue(of(roles));
      mockAclService.getEndpoints.mockReturnValue(of(endpoints));
      mockAclService.list.mockReturnValue(of(aces));

      component.loadAces();

      expect(component.aces.length).toBe(1);
      expect(component.aces[0].endpoint_name).toBe('Test API');
      expect(component.aces[0].role_name).toBe('Admin');
    });

    it('should use path as endpoint_name when endpoint not found', () => {
      const roles: Role[] = []; // No roles returned
      const endpoints: Endpoint[] = [];
      const aces: ACE[] = [
        {
          ace_id: 'ace1',
          ace_type: 'group' as any,
          group_id: mockGroup.user_group_id,
          path: '/api/unknown',
          role_id: 'role1',
          propagate: false,
          allowed: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockRoleService.get.mockReturnValue(of(roles));
      mockAclService.getEndpoints.mockReturnValue(of(endpoints));
      mockAclService.list.mockReturnValue(of(aces));

      component.loadAces();

      expect(component.aces[0].endpoint_name).toBe('/api/unknown');
      expect(component.aces[0].role_name).toBe('Unknown');
    });

    it('should update aceDatasource data when ACEs are loaded', () => {
      const roles = [createMockRole('role1', 'Admin')];
      const endpoints = [createMockEndpoint('/api/test', 'Test')];
      const aces: ACE[] = [
        {
          ace_id: 'ace1',
          ace_type: 'group' as any,
          group_id: mockGroup.user_group_id,
          path: '/api/test',
          role_id: 'role1',
          propagate: true,
          allowed: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockRoleService.get.mockReturnValue(of(roles));
      mockAclService.getEndpoints.mockReturnValue(of(endpoints));
      mockAclService.list.mockReturnValue(of(aces));

      component.loadAces();

      expect(component.aceDatasource.data).toEqual(component.aces);
    });

    it('should handle error when loading ACEs fails', () => {
      // Make aclService.list fail - this is the innermost subscribe with error handling
      mockRoleService.get.mockReturnValue(of([]));
      mockAclService.getEndpoints.mockReturnValue(of([]));
      mockAclService.list.mockReturnValue(throwError(() => new Error('Load failed')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.loadAces();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load ACEs:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('filteredMembers', () => {
    it('should return all members when search is empty', () => {
      const users = [
        createMockUser('1', 'Alice'),
        createMockUser('2', 'Bob'),
      ];
      component.members.set(users);
      component.searchMembers = '';

      expect(component.filteredMembers()).toEqual(users);
    });

    it('should filter members by username case-insensitively', () => {
      const users = [
        createMockUser('1', 'Alice'),
        createMockUser('2', 'Bob'),
        createMockUser('3', 'alice_smith'),
      ];
      component.members.set(users);
      component.searchMembers = 'alice';

      const filtered = component.filteredMembers();
      expect(filtered.length).toBe(2);
      expect(filtered[0].username).toBe('Alice');
      expect(filtered[1].username).toBe('alice_smith');
    });

    it('should return empty array when no members match', () => {
      const users = [createMockUser('1', 'Alice')];
      component.members.set(users);
      component.searchMembers = 'xyz';

      expect(component.filteredMembers()).toEqual([]);
    });
  });

  describe('onUpdate', () => {
    it('should not update if form is invalid', () => {
      component.editGroupForm.get('groupname')?.setValue('');

      component.onUpdate();

      expect(mockGroupService.update).not.toHaveBeenCalled();
    });

    it('should call groupService.update with updated group', () => {
      const newName = 'UpdatedGroupName';
      component.editGroupForm.get('groupname')?.setValue(newName);
      mockGroupService.update.mockReturnValue(of({}));

      component.onUpdate();

      expect(mockGroupService.update).toHaveBeenCalledWith(mockController, {
        ...mockGroup,
        name: newName,
      });
    });

    it('should update local group name on success', () => {
      const newName = 'UpdatedGroupName';
      component.editGroupForm.get('groupname')?.setValue(newName);
      mockGroupService.update.mockReturnValue(of({}));

      component.onUpdate();

      expect(component.group.name).toBe(newName);
    });

    it('should show success toast on successful update', () => {
      component.editGroupForm.get('groupname')?.setValue('UpdatedGroup');
      mockGroupService.update.mockReturnValue(of({}));

      component.onUpdate();

      expect(mockToastService.success).toHaveBeenCalledWith('Group updated successfully');
    });

    it('should show error toast on failed update', () => {
      component.editGroupForm.get('groupname')?.setValue('UpdatedGroup');
      mockGroupService.update.mockReturnValue(throwError(() => new Error('Update failed')));

      component.onUpdate();

      expect(mockToastService.error).toHaveBeenCalledWith('Cannot update group: Error: Update failed');
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('openAddUserDialog', () => {
    it('should open AddUserToGroupDialogComponent dialog', () => {
      component.openAddUserDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(AddUserToGroupDialogComponent, {
        panelClass: ['base-dialog-panel', 'simple-dialog-panel', 'add-user-to-group-dialog-panel'],
        data: { controller: mockController, group: mockGroup },
      });
    });

    it('should reload members when dialog returns true', () => {
      component.openAddUserDialog();

      addUserClosed$.next(true);

      expect(mockGroupService.getGroupMember).toHaveBeenCalledTimes(2);
    });

    it('should not reload members when dialog returns false', () => {
      component.openAddUserDialog();

      addUserClosed$.next(false);

      expect(mockGroupService.getGroupMember).toHaveBeenCalledTimes(1);
    });
  });

  describe('openRemoveUserDialog', () => {
    let mockUser: User;

    beforeEach(() => {
      mockUser = createMockUser('1', 'TestUser');
    });

    it('should open RemoveToGroupDialogComponent dialog', () => {
      component.openRemoveUserDialog(mockUser);

      expect(mockDialog.open).toHaveBeenCalledWith(RemoveToGroupDialogComponent, {
        panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel'],
        data: { name: mockUser.username },
      });
    });

    it('should remove user when dialog returns true', () => {
      component.openRemoveUserDialog(mockUser);
      mockGroupService.removeUser.mockReturnValue(of({}));

      removeUserClosed$.next(true);

      expect(mockGroupService.removeUser).toHaveBeenCalledWith(mockController, mockGroup, mockUser);
    });

    it('should show success toast when user is removed', () => {
      component.openRemoveUserDialog(mockUser);
      mockGroupService.removeUser.mockReturnValue(of({}));

      removeUserClosed$.next(true);

      expect(mockToastService.success).toHaveBeenCalledWith(`User ${mockUser.username} was removed`);
    });

    it('should reload members after successful removal', () => {
      component.openRemoveUserDialog(mockUser);
      mockGroupService.removeUser.mockReturnValue(of({}));

      removeUserClosed$.next(true);

      expect(mockGroupService.getGroupMember).toHaveBeenCalledTimes(2);
    });

    it('should show error toast when removal fails', () => {
      component.openRemoveUserDialog(mockUser);
      mockGroupService.removeUser.mockReturnValue(throwError(() => new Error('Remove failed')));

      removeUserClosed$.next(true);

      expect(mockToastService.error).toHaveBeenCalledWith(`Error while removing user: Error: Remove failed`);
    });

    it('should not remove user when dialog returns false', () => {
      component.openRemoveUserDialog(mockUser);

      removeUserClosed$.next(false);

      expect(mockGroupService.removeUser).not.toHaveBeenCalled();
    });
  });

  describe('openUserDetailDialog', () => {
    it('should open UserDetailDialogComponent dialog', () => {
      const mockUser = createMockUser('1', 'TestUser');

      component.openUserDetailDialog(mockUser);

      expect(mockDialog.open).toHaveBeenCalledWith(UserDetailDialogComponent, {
        panelClass: ['base-dialog-panel', 'configurator-dialog-panel'],
        data: { user: mockUser, controller: mockController },
      });
    });
  });
});
