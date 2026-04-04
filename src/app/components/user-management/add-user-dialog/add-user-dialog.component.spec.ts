import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { UserService } from '@services/user.service';
import { GroupService } from '@services/group.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { User } from '@models/users/user';
import { of, throwError, lastValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('AddUserDialogComponent', () => {
  let component: AddUserDialogComponent;
  let fixture: ComponentFixture<AddUserDialogComponent>;
  let mockUserService: Partial<UserService>;
  let mockGroupService: Partial<GroupService>;
  let mockToasterService: Partial<ToasterService>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

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
    { user_group_id: 'group-3', name: 'Developers', created_at: '', updated_at: '', is_builtin: false },
  ];

  const mockUser: User = {
    user_id: 'user-123',
    username: 'newuser',
    email: 'newuser@example.com',
    full_name: 'New User',
    is_active: true,
    is_superadmin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    last_login: '2024-01-03',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUserService = {
      add: vi.fn().mockReturnValue(of(mockUser)),
      list: vi.fn().mockReturnValue(of([])),
    };

    mockGroupService = {
      getGroups: vi.fn().mockReturnValue(of(mockGroups)),
      addMemberToGroup: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AddUserDialogComponent,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDividerModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: UserService, useValue: mockUserService },
        { provide: GroupService, useValue: mockGroupService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUserDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form with all required fields', () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.addUserForm).toBeInstanceOf(UntypedFormGroup);
      expect(component.addUserForm.get('username')).toBeTruthy();
      expect(component.addUserForm.get('email')).toBeTruthy();
      expect(component.addUserForm.get('password')).toBeTruthy();
      expect(component.addUserForm.get('confirmPassword')).toBeTruthy();
      expect(component.addUserForm.get('full_name')).toBeTruthy();
      expect(component.addUserForm.get('is_active')).toBeTruthy();
    });

    it('should load groups from groupService', () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(mockGroupService.getGroups).toHaveBeenCalledWith(mockController);
    });

    it('should set is_active to true by default', () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.addUserForm.get('is_active')?.value).toBe(true);
    });

    it('should set groups when loaded', () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.groups).toEqual(mockGroups);
    });

    it('should handle empty groups response', () => {
      (mockGroupService.getGroups as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.groups).toEqual([]);
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      component.ngOnInit();
      fixture.detectChanges();
      const form = component.form;
      expect(form.username).toBeDefined();
      expect(form.email).toBeDefined();
      expect(form.password).toBeDefined();
      expect(form.confirmPassword).toBeDefined();
      expect(form.full_name).toBeDefined();
      expect(form.is_active).toBeDefined();
    });
  });

  describe('onCancelClick', () => {
    it('should close dialog', () => {
      component.onCancelClick();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('selectedGroup', () => {
    it('should add group to groupsToAdd Set', () => {
      const group = mockGroups[0];
      component.selectedGroup(group);
      expect(component.groupsToAdd.has(group)).toBe(true);
    });

    it('should allow adding multiple groups', () => {
      component.selectedGroup(mockGroups[0]);
      component.selectedGroup(mockGroups[1]);
      expect(component.groupsToAdd.size).toBe(2);
    });
  });

  describe('deleteGroup', () => {
    it('should remove group from groupsToAdd Set', () => {
      component.groupsToAdd.add(mockGroups[0]);
      component.groupsToAdd.add(mockGroups[1]);
      component.deleteGroup(mockGroups[0]);
      expect(component.groupsToAdd.has(mockGroups[0])).toBe(false);
      expect(component.groupsToAdd.has(mockGroups[1])).toBe(true);
    });

    it('should not throw when deleting non-existent group', () => {
      expect(() => component.deleteGroup(mockGroups[0])).not.toThrow();
    });
  });

  describe('displayFn', () => {
    it('should return name when value has name property', () => {
      const group = { name: 'TestGroup' };
      expect(component.displayFn(group)).toBe('TestGroup');
    });

    it('should return empty string when value is null', () => {
      expect(component.displayFn(null)).toBe('');
    });

    it('should return empty string when value is undefined', () => {
      expect(component.displayFn(undefined)).toBe('');
    });

    it('should return empty string when value has no name property', () => {
      expect(component.displayFn({})).toBe('');
    });
  });

  describe('onAddClick', () => {
    beforeEach(() => {
      component.ngOnInit();
      // Clear async validators to avoid timing issues in tests
      component.addUserForm.get('username')?.clearAsyncValidators();
      component.addUserForm.get('email')?.clearAsyncValidators();
      component.addUserForm.updateValueAndValidity();
    });

    it('should not call userService.add when form is invalid', () => {
      component.addUserForm.get('username')?.setValue(''); // Required field empty
      component.addUserForm.get('password')?.setValue(''); // Required field empty
      component.onAddClick();
      expect(mockUserService.add).not.toHaveBeenCalled();
    });

    it('should not call userService.add when passwords do not match', () => {
      component.addUserForm.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });
      component.onAddClick();
      expect(mockUserService.add).not.toHaveBeenCalled();
    });

    it('should call userService.add with form values when form is valid', () => {
      component.addUserForm.patchValue({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'New User',
        is_active: true,
      });
      component.onAddClick();
      expect(mockUserService.add).toHaveBeenCalledWith(
        mockController,
        expect.objectContaining({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          full_name: 'New User',
          is_active: true,
        })
      );
    });

    it('should close dialog and show success toast on add success', () => {
      component.addUserForm.patchValue({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'New User',
        is_active: true,
      });
      component.onAddClick();

      expect(mockToasterService.success).toHaveBeenCalledWith('User newuser added');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should add user to selected groups on success', () => {
      component.addUserForm.patchValue({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'New User',
        is_active: true,
      });
      component.selectedGroup(mockGroups[0]);
      component.selectedGroup(mockGroups[1]);
      component.onAddClick();

      expect(mockGroupService.addMemberToGroup).toHaveBeenCalledTimes(2);
      expect(mockToasterService.success).toHaveBeenCalledWith('user newuser was added to group Admins');
    });

    it('should show error toast when userService.add fails', () => {
      (mockUserService.add as ReturnType<typeof vi.fn>).mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { message: 'User already exists' } }))
      );
      component.addUserForm.patchValue({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'Existing User',
        is_active: true,
      });
      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot create user: User already exists');
    });

    it('should not close dialog when userService.add fails', () => {
      (mockUserService.add as ReturnType<typeof vi.fn>).mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { message: 'Error' } }))
      );
      component.addUserForm.patchValue({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        full_name: 'New User',
        is_active: true,
      });
      component.onAddClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('_filter (via filteredGroups observable)', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter groups by name when autocomplete changes', () => {
      const results: Group[][] = [];
      component.filteredGroups.subscribe((groups) => results.push(groups));
      component.autocompleteControl.setValue('admin');
      fixture.detectChanges();
      const filteredResult = results.find((groups) => groups.length === 1);
      expect(filteredResult).toBeDefined();
      expect(filteredResult![0].name).toBe('Admins');
    });

    it('should return empty array when no matches found', () => {
      const results: Group[][] = [];
      component.filteredGroups.subscribe((groups) => results.push(groups));
      component.autocompleteControl.setValue('xyz123');
      fixture.detectChanges();
      const filteredResult = results.find((groups) => groups.length === 0);
      expect(filteredResult).toBeDefined();
      expect(filteredResult!.length).toBe(0);
    });

    it('should be case insensitive', () => {
      const results: Group[][] = [];
      component.filteredGroups.subscribe((groups) => results.push(groups));
      component.autocompleteControl.setValue('ADMIN');
      fixture.detectChanges();
      const filteredResult = results.find((groups) => groups.length === 1);
      expect(filteredResult).toBeDefined();
      expect(filteredResult![0].name).toBe('Admins');
    });
  });
});
