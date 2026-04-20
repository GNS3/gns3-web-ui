import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddUserToGroupDialogComponent } from './add-user-to-group-dialog.component';
import { UserService } from '@services/user.service';
import { GroupService } from '@services/group.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { User } from '@models/users/user';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { forkJoin, of, throwError } from 'rxjs';

describe('AddUserToGroupDialogComponent', () => {
  let fixture: ComponentFixture<AddUserToGroupDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockUserService: { list: ReturnType<typeof vi.fn> };
  let mockGroupService: { getGroupMember: ReturnType<typeof vi.fn>; addMemberToGroup: ReturnType<typeof vi.fn> };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: '',
    password: '',
    location: 'local',
    authToken: '',
    status: 'running',
    tokenExpired: false,
  };
  const mockGroup: Group = {
    user_group_id: 'group1',
    name: 'Test Group',
    created_at: '',
    updated_at: '',
    is_builtin: false,
  };

  const mockUsers: User[] = [
    {
      user_id: '1',
      username: 'alice',
      email: 'alice@test.com',
      created_at: '',
      updated_at: '',
      full_name: '',
      last_login: '',
      is_active: true,
      is_superadmin: false,
    },
    {
      user_id: '2',
      username: 'bob',
      email: 'bob@test.com',
      created_at: '',
      updated_at: '',
      full_name: '',
      last_login: '',
      is_active: true,
      is_superadmin: false,
    },
    {
      user_id: '3',
      username: 'charlie',
      email: 'charlie@test.com',
      created_at: '',
      updated_at: '',
      full_name: '',
      last_login: '',
      is_active: true,
      is_superadmin: false,
    },
  ];

  const mockMembers: User[] = [
    {
      user_id: '1',
      username: 'alice',
      email: 'alice@test.com',
      created_at: '',
      updated_at: '',
      full_name: '',
      last_login: '',
      is_active: true,
      is_superadmin: false,
    },
  ];

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockToastService = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    mockUserService = { list: vi.fn().mockReturnValue(of(mockUsers)) };
    mockGroupService = {
      getGroupMember: vi.fn().mockReturnValue(of(mockMembers)),
      addMemberToGroup: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        AddUserToGroupDialogComponent,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController, group: mockGroup } },
        { provide: UserService, useValue: mockUserService },
        { provide: GroupService, useValue: mockGroupService },
        { provide: ToasterService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUserToGroupDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('dialog rendering', () => {
    it('should display the group name in the dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain(mockGroup.name);
    });

    it('should display search input field', () => {
      const searchInput = fixture.nativeElement.querySelector('input[matInput]');
      expect(searchInput).toBeTruthy();
    });

    it('should display Add Selected button', () => {
      const addButton = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(addButton.textContent).toContain('Add Selected');
    });

    it('should disable Add Selected button when no users are selected', () => {
      const addButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(addButton.disabled).toBe(true);
    });
  });

  describe('user list loading', () => {
    it('should load users and filter out existing group members', () => {
      expect(mockUserService.list).toHaveBeenCalledWith(mockController);
      expect(mockGroupService.getGroupMember).toHaveBeenCalledWith(mockController, mockGroup.user_group_id);
    });

    it('should display only non-member users in the list', () => {
      const displayedUsers = fixture.nativeElement.querySelectorAll('.user-item');
      expect(displayedUsers.length).toBe(2);
    });
  });

  describe('user selection', () => {
    it('should select a user when toggleUserSelection is called', () => {
      fixture.componentInstance.toggleUserSelection('2');
      fixture.detectChanges();

      expect(fixture.componentInstance.isUserSelected('2')).toBe(true);
      expect(fixture.componentInstance.selectedCount()).toBe(1);
    });

    it('should deselect a user when toggleUserSelection is called again', () => {
      fixture.componentInstance.toggleUserSelection('2');
      fixture.detectChanges();
      fixture.componentInstance.toggleUserSelection('2');
      fixture.detectChanges();

      expect(fixture.componentInstance.isUserSelected('2')).toBe(false);
      expect(fixture.componentInstance.selectedCount()).toBe(0);
    });
  });

  describe('select all functionality', () => {
    it('should select all displayed users when toggleSelectAll is called', () => {
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.allSelected()).toBe(true);
      expect(fixture.componentInstance.selectedCount()).toBe(2);
    });

    it('should deselect all users when toggleSelectAll is called twice', () => {
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.allSelected()).toBe(false);
      expect(fixture.componentInstance.selectedCount()).toBe(0);
    });

    it('should enable Add Selected button when users are selected', () => {
      fixture.componentInstance.toggleUserSelection('2');
      fixture.detectChanges();

      const addButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(addButton.disabled).toBe(false);
    });
  });

  describe('addSelectedUsers', () => {
    it('should show warning toast when no users are selected', () => {
      fixture.componentInstance.addSelectedUsers();
      fixture.detectChanges();

      expect(mockToastService.warning).toHaveBeenCalledWith('Please select at least one user');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should add all selected users to the group', () => {
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();
      fixture.componentInstance.addSelectedUsers();
      fixture.detectChanges();

      expect(mockGroupService.addMemberToGroup).toHaveBeenCalledTimes(2);
    });

    it('should close dialog with true on success', () => {
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();
      fixture.componentInstance.addSelectedUsers();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show success toast with count of added users', () => {
      fixture.componentInstance.toggleSelectAll();
      fixture.detectChanges();
      fixture.componentInstance.addSelectedUsers();
      fixture.detectChanges();

      expect(mockToastService.success).toHaveBeenCalledWith('2 user(s) added to group');
    });
  });

  describe('addUser (single user)', () => {
    it('should remove user from displayed list after adding', () => {
      expect(fixture.componentInstance.displayedUsers.value.length).toBe(2);

      fixture.componentInstance.addUser(mockUsers[1]);
      fixture.detectChanges();

      expect(fixture.componentInstance.displayedUsers.value.length).toBe(1);
      expect(fixture.componentInstance.displayedUsers.value[0].username).toBe('charlie');
    });

    it('should show success toast after adding user', () => {
      mockGroupService.addMemberToGroup.mockReturnValue(of({}));
      fixture.componentInstance.addUser(mockUsers[1]);
      fixture.detectChanges();

      expect(mockToastService.success).toHaveBeenCalledWith('user bob was added');
    });

    it('should show error toast when adding user fails', () => {
      mockGroupService.addMemberToGroup.mockReturnValue(throwError(() => ({ message: 'error' })));
      fixture.componentInstance.addUser(mockUsers[1]);
      fixture.detectChanges();

      expect(mockToastService.error).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should close dialog when cancel button is clicked', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[mat-button]');
      cancelButton.click();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close dialog when onClose is called', () => {
      fixture.componentInstance.onClose();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
