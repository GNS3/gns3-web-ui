import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { ProgressService } from '../../common/progress/progress.service';
import { UserManagementComponent } from './user-management.component';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userService: {
    list: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let controllerService: { get: ReturnType<typeof vi.fn> };
  let toasterService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let progressService: { setError: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let location: { back: ReturnType<typeof vi.fn> };

  const controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    protocol: 'http:',
    authToken: 'token',
    tokenExpired: false,
  } as Controller;

  const createUser = (overrides: Partial<User> = {}): User => ({
    user_id: 'user-1',
    username: 'alice',
    full_name: 'Alice Example',
    email: 'alice@example.com',
    is_active: true,
    is_superadmin: false,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-02T10:00:00Z',
    last_login: '2026-01-03T10:00:00Z',
    ...overrides,
  });

  beforeEach(async () => {
    const users = [
      createUser(),
      createUser({
        user_id: 'user-2',
        username: 'admin',
        full_name: 'Server Administrator',
        email: 'admin@example.com',
        is_superadmin: true,
      }),
      createUser({
        user_id: 'user-3',
        username: 'disabled',
        full_name: '',
        email: '',
        is_active: false,
      }),
    ];

    userService = {
      list: vi.fn().mockReturnValue(of(users)),
      get: vi.fn().mockImplementation((_controller, userId) => of(users.find((user) => user.user_id === userId))),
      delete: vi.fn().mockReturnValue(of(null)),
    };
    controllerService = { get: vi.fn().mockResolvedValue(controller) };
    toasterService = { success: vi.fn(), error: vi.fn() };
    progressService = { setError: vi.fn() };
    location = { back: vi.fn() };
    dialog = {
      open: vi.fn().mockReturnValue({
        componentInstance: {},
        afterClosed: vi.fn().mockReturnValue(of(false)),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: ControllerService, useValue: controllerService },
        { provide: ToasterService, useValue: toasterService },
        { provide: ProgressService, useValue: progressService },
        { provide: MatDialog, useValue: dialog },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } },
            parent: { snapshot: { paramMap: { get: vi.fn().mockReturnValue('1') } } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    component['dialog'] = dialog as unknown as MatDialog;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads users from the existing users API', () => {
    expect(controllerService.get).toHaveBeenCalledWith(1);
    expect(userService.list).toHaveBeenCalledWith(controller);
    expect(component.users()).toHaveLength(3);
    expect(component.loading()).toBe(false);
  });

  it('defaults pagination to 25 items', () => {
    expect(component.pageSize()).toBe(25);
    expect(component.pageSizeOptions).toContain(25);
  });

  it('filters by search text, active scope, and administrator scope', () => {
    component.setSearch('server');
    expect(component.filteredUsers().map((user) => user.username)).toEqual(['admin']);

    component.setSearch('');
    component.setScope('active');
    expect(component.filteredUsers()).toHaveLength(2);

    component.setScope('administrators');
    expect(component.filteredUsers().map((user) => user.username)).toEqual(['admin']);
  });

  it('supports list and grid views', () => {
    expect(component.viewMode()).toBe('list');
    component.setViewMode('grid');
    fixture.detectChanges();
    expect(component.viewMode()).toBe('grid');
    expect(fixture.nativeElement.querySelector('.users-page__grid')).toBeTruthy();
  });

  it('selects a user and refreshes the detail record', () => {
    const user = component.users()[0];
    component.selectUser(user);

    expect(userService.get).toHaveBeenCalledWith(controller, user.user_id);
    expect(component.selectedUser()?.username).toBe('alice');
  });

  it('selects and clears all currently filtered users', () => {
    component.setScope('administrators');
    component.masterToggle();
    expect(component.selection.selected.map((user) => user.username)).toEqual(['admin']);

    component.masterToggle();
    expect(component.selection.isEmpty()).toBe(true);
  });

  it('opens the edit dialog with freshly fetched user data', () => {
    const user = component.users()[0];
    component.openUserDetailDialog(user);

    expect(userService.get).toHaveBeenCalledWith(controller, user.user_id);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('deletes a confirmed user and reloads the list', () => {
    dialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(true)),
    });
    const user = component.users()[0];

    component.onDelete(user);

    expect(userService.delete).toHaveBeenCalledWith(controller, user.user_id);
    expect(userService.list).toHaveBeenCalledTimes(2);
    expect(toasterService.success).toHaveBeenCalledWith(`User "${user.username}" deleted.`);
  });

  it('reports user-list errors without leaving the loading state active', () => {
    const error = { error: { message: 'Users unavailable' } };
    userService.list.mockReturnValue(throwError(() => error));

    component.refresh();

    expect(component.loading()).toBe(false);
    expect(progressService.setError).toHaveBeenCalledWith(error);
    expect(toasterService.error).toHaveBeenCalledWith('Users unavailable');
    expect(location.back).toHaveBeenCalled();
  });
});
