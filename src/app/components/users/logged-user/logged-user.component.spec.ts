import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggedUserComponent } from './logged-user.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ControllerService } from '@services/controller.service';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeUserPasswordComponent } from '@components/user-management/user-detail/change-user-password/change-user-password.component';
import { Controller } from '@models/controller';
import { User } from '@models/users/user';
import { of, throwError } from 'rxjs';

describe('LoggedUserComponent', () => {
  let component: LoggedUserComponent;
  let fixture: ComponentFixture<LoggedUserComponent>;
  let mockControllerService: ControllerService;
  let mockUserService: UserService;
  let mockToasterService: ToasterService;
  let mockDialog: MatDialog;

  const mockUser: User = {
    created_at: '2024-01-01',
    email: 'test@example.com',
    full_name: 'Test User',
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
    updated_at: '2024-01-01',
    user_id: 'user-123',
    username: 'testuser',
  };

  const mockController: Controller = {
    authToken: 'test-auth-token-12345',
    id: 1,
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '/',
    ubridge_path: '',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    status: 'running',
    tokenExpired: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockControllerService = {
      get: vi.fn().mockResolvedValue(mockController),
    } as any as ControllerService;

    mockUserService = {
      getInformationAboutLoggedUser: vi.fn().mockReturnValue(of(mockUser)),
    } as any as UserService;

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    } as any as ToasterService;

    mockDialog = {
      open: vi.fn(),
    } as any as MatDialog;

    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    } as any as ActivatedRoute;

    // Mock document.execCommand for copyToken
    vi.stubGlobal('document', {
      execCommand: vi.fn(),
      createElement: vi.fn().mockReturnValue({
        style: {},
        appendChild: vi.fn(),
        focus: vi.fn(),
        select: vi.fn(),
        remove: vi.fn(),
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    await TestBed.configureTestingModule({
      imports: [
        LoggedUserComponent,
        RouterModule,
        MatButtonModule,
        MatDialogModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: UserService, useValue: mockUserService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoggedUserComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load controller from route param and fetch user info', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockControllerService.get).toHaveBeenCalledWith(1);
      expect(mockUserService.getInformationAboutLoggedUser).toHaveBeenCalledWith(mockController);
    });

    it('should set user signal when user info is loaded', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.user()).toEqual(mockUser);
    });

    it('should handle error when controller service fails', async () => {
      mockControllerService.get = vi.fn().mockRejectedValue(new Error('Controller not found'));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.user()).toBeUndefined();
    });

    it('should handle error when user service fails', async () => {
      mockUserService.getInformationAboutLoggedUser = vi.fn().mockReturnValue(
        throwError(() => new Error('User info failed'))
      );

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.user()).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should open change password dialog with correct parameters', () => {
      component.controller = mockController;
      component.user.set(mockUser);

      component.changePassword();

      expect(mockDialog.open).toHaveBeenCalledWith(ChangeUserPasswordComponent, {
        panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel'],
        data: { user: mockUser, controller: mockController, self_update: true },
      });
    });

    it('should open dialog even when user is not set', () => {
      component.controller = mockController;
      component.user.set(undefined);

      component.changePassword();

      expect(mockDialog.open).toHaveBeenCalledWith(ChangeUserPasswordComponent, {
        panelClass: ['base-dialog-panel', 'change-user-password-dialog-panel'],
        data: { user: undefined, controller: mockController, self_update: true },
      });
    });
  });

  describe('copyToken', () => {
    it('should copy auth token to clipboard and show success toast', () => {
      component.controller = mockController;

      component.copyToken();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(mockToasterService.success).toHaveBeenCalledWith('Token copied');
    });

    it('should create and remove textarea element', () => {
      const mockCreateElement = vi.fn().mockReturnValue({
        style: {},
        appendChild: vi.fn(),
        focus: vi.fn(),
        select: vi.fn(),
        remove: vi.fn(),
      });
      const mockBodyRemoveChild = vi.fn();
      vi.stubGlobal('document', {
        execCommand: vi.fn(),
        createElement: mockCreateElement,
        body: {
          appendChild: vi.fn(),
          removeChild: mockBodyRemoveChild,
        },
      });

      component.controller = mockController;
      component.copyToken();

      expect(mockCreateElement).toHaveBeenCalledWith('textarea');
      expect(mockBodyRemoveChild).toHaveBeenCalled();
    });

    it('should show error toast when copy fails', () => {
      vi.stubGlobal('document', {
        execCommand: vi.fn().mockImplementation(() => {
          throw new Error('Copy failed');
        }),
        createElement: vi.fn().mockReturnValue({
          style: {},
          appendChild: vi.fn(),
          focus: vi.fn(),
          select: vi.fn(),
          remove: vi.fn(),
        }),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      });

      component.controller = mockController;
      component.copyToken();

      expect(mockToasterService.error).toHaveBeenCalled();
    });
  });
});
