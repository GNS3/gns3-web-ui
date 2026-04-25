import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { AddGroupDialogComponent } from './add-group-dialog.component';
import { GroupNameValidator } from './GroupNameValidator';
import { GroupService } from '@services/group.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { Group } from '@models/groups/group';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddGroupDialogComponent', () => {
  let component: AddGroupDialogComponent;
  let fixture: ComponentFixture<AddGroupDialogComponent>;

  let mockDialogRef: any;
  let mockGroupService: any;
  let mockUserService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;
  let mockController: Controller;
  let mockUsers: User[];

  const createMockUser = (userId: string, username: string, email: string): User => ({
    created_at: '2024-01-01',
    email,
    full_name: username,
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
    updated_at: '2024-01-01',
    user_id: userId,
    username,
  });

  const createMockGroup = (userGroupId: string, name: string): Group => ({
    name,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    user_group_id: userGroupId,
    is_builtin: false,
  });

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller);

  beforeEach(async () => {
    mockUsers = [
      createMockUser('user1', 'john.doe', 'john@example.com'),
      createMockUser('user2', 'jane.smith', 'jane@example.com'),
      createMockUser('user3', 'bob.wilson', 'bob@example.com'),
    ];

    mockController = createMockController();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockGroupService = {
      getGroups: vi.fn().mockReturnValue(of([])),
      addGroup: vi.fn().mockReturnValue(of(createMockGroup('group1', 'TestGroup'))),
      addMemberToGroup: vi.fn().mockReturnValue(of({})),
    };

    mockUserService = {
      list: vi.fn().mockReturnValue(of(mockUsers)),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
      detectChanges: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddGroupDialogComponent, MatDialogModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController } },
        { provide: GroupService, useValue: mockGroupService },
        { provide: UserService, useValue: mockUserService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        GroupNameValidator,
        UntypedFormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty usersToAdd set', () => {
      expect(component.usersToAdd.size).toBe(0);
    });

    it('should set loading to false initially', () => {
      expect(component.loading).toBe(false);
    });

    it('should store controller from dialog data', () => {
      expect(component.controller).toEqual(mockController);
    });
  });

  describe('ngOnInit', () => {
    it('should load users from UserService', () => {
      expect(mockUserService.list).toHaveBeenCalledWith(mockController);
    });

    it('should populate users array with loaded users', () => {
      expect(component.users).toEqual(mockUsers);
    });

    it('should set up filteredUsers observable', () => {
      expect(component.filteredUsers).toBeDefined();
    });
  });

  describe('form validation', () => {
    it('should have a groupNameForm with groupName control', () => {
      expect(component.groupNameForm).toBeDefined();
      expect(component.groupNameForm.contains('groupName')).toBe(true);
    });

    it('should require groupName to be non-empty', () => {
      const groupNameControl = component.groupNameForm.get('groupName');
      groupNameControl?.setValue('');
      expect(groupNameControl?.hasError('required')).toBe(true);
    });

    it('should reject group name with invalid characters', () => {
      const groupNameControl = component.groupNameForm.get('groupName');
      groupNameControl?.setValue('Invalid@Group!');
      expect(groupNameControl?.hasError('invalidName')).toBe(true);
    });

    it('should return null for valid group name pattern', () => {
      const validator = new GroupNameValidator();
      const result = validator.get({ value: 'ValidGroup123' });
      expect(result).toBeNull();
    });

    it('should return invalidName error for special characters', () => {
      const validator = new GroupNameValidator();
      const result = validator.get({ value: 'Invalid@Name!' });
      expect(result).toEqual({ invalidName: true });
    });
  });

  describe('onAddClick', () => {
    it('should do nothing when form is invalid', () => {
      component.groupNameForm.get('groupName')?.setValue('');
      component.onAddClick();
      expect(mockGroupService.addGroup).not.toHaveBeenCalled();
    });

    it('should call addGroup with controller and group name when form is valid', () => {
      component.groupNameForm.get('groupName')?.setValue('TestGroup');
      component.onAddClick();
      expect(mockGroupService.addGroup).toHaveBeenCalledWith(mockController, 'TestGroup');
    });

    it('should close dialog with false when addGroup fails', () => {
      mockGroupService.addGroup.mockReturnValue(throwError(() => ({ error: { message: 'Failed to create group' } })));
      component.groupNameForm.get('groupName')?.setValue('TestGroup');
      component.onAddClick();
      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to create group');
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('ngOnInit error handling', () => {
    it('should display error when userService.list fails', async () => {
      mockUserService.list.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load users' } })));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to load users');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error when userService.list fails with no message', async () => {
      mockUserService.list.mockReturnValue(throwError(() => new Error('Network error')));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.ngOnInit();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onAddClick error handling', () => {
    it('should display error when addMemberToGroup fails', async () => {
      component.groupNameForm.get('groupName')?.setValue('TestGroup');
      component.selectedUser(mockUsers[0]);
      mockGroupService.addMemberToGroup.mockReturnValue(throwError(() => ({ error: { message: 'Failed to add user' } })));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.onAddClick();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to add user');
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should display fallback error when addMemberToGroup fails with no message', async () => {
      component.groupNameForm.get('groupName')?.setValue('TestGroup');
      component.selectedUser(mockUsers[0]);
      mockGroupService.addMemberToGroup.mockReturnValue(throwError(() => ({})));
      const cdrSpy = vi.spyOn(component['cd'], 'markForCheck');

      component.onAddClick();

      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to add user to group');
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onNoClick', () => {
    it('should close dialog without value', () => {
      component.onNoClick();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('selectedUser', () => {
    it('should add user to usersToAdd set', () => {
      const user = mockUsers[0];
      component.selectedUser(user);
      expect(component.usersToAdd.has(user)).toBe(true);
    });

    it('should allow adding multiple users', () => {
      component.selectedUser(mockUsers[0]);
      component.selectedUser(mockUsers[1]);
      expect(component.usersToAdd.size).toBe(2);
    });

    it('should not duplicate user if already in set', () => {
      const user = mockUsers[0];
      component.selectedUser(user);
      component.selectedUser(user);
      expect(component.usersToAdd.size).toBe(1);
    });
  });

  describe('delUser', () => {
    it('should remove user from usersToAdd set', () => {
      const user = mockUsers[0];
      component.selectedUser(user);
      component.delUser(user);
      expect(component.usersToAdd.has(user)).toBe(false);
    });

    it('should not affect set if user was not present', () => {
      const initialSize = component.usersToAdd.size;
      component.delUser(mockUsers[0]);
      expect(component.usersToAdd.size).toBe(initialSize);
    });
  });

  describe('filteredUsers behavior', () => {
    it('should filter users by username when autocompleteControl changes', () => {
      component.ngOnInit();
      component.autocompleteControl.setValue('john');
      fixture.detectChanges();
      let filteredResult: User[] = [];
      component.filteredUsers.subscribe((users) => {
        filteredResult = users;
      });
      expect(filteredResult.some((u) => u.username.includes('john'))).toBe(true);
    });

    it('should return all users when filter is empty string', () => {
      component.ngOnInit();
      component.autocompleteControl.setValue('');
      fixture.detectChanges();
      let filteredResult: User[] = [];
      component.filteredUsers.subscribe((users) => {
        filteredResult = users;
      });
      expect(filteredResult.length).toBe(mockUsers.length);
    });

    it('should filter users by email when autocompleteControl changes', () => {
      component.ngOnInit();
      component.autocompleteControl.setValue('jane@example');
      fixture.detectChanges();
      let filteredResult: User[] = [];
      component.filteredUsers.subscribe((users) => {
        filteredResult = users;
      });
      expect(filteredResult.some((u) => u.email.includes('jane@example'))).toBe(true);
    });
  });

  describe('displayFn', () => {
    it('should return username when value has username property', () => {
      const result = component.displayFn(mockUsers[0]);
      expect(result).toBe('john.doe');
    });

    it('should return empty string when value is null', () => {
      const result = component.displayFn(null);
      expect(result).toBe('');
    });

    it('should return empty string when value is undefined', () => {
      const result = component.displayFn(undefined);
      expect(result).toBe('');
    });

    it('should return empty string when value has no username', () => {
      const result = component.displayFn({});
      expect(result).toBe('');
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const event = { key: 'Enter' } as KeyboardEvent;
      vi.spyOn(component, 'onAddClick');
      component.onKeyDown(event);
      expect(component.onAddClick).toHaveBeenCalled();
    });

    it('should do nothing when non-Enter key is pressed', () => {
      const event = { key: 'Escape' } as KeyboardEvent;
      vi.spyOn(component, 'onAddClick');
      component.onKeyDown(event);
      expect(component.onAddClick).not.toHaveBeenCalled();
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      expect(component.form).toBe(component.groupNameForm.controls);
    });
  });
});
