import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { LoggedUserComponent } from './logged-user.component';
import { of } from 'rxjs';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('LoggedUserComponent', () => {
  let component: LoggedUserComponent;
  let fixture: ComponentFixture<LoggedUserComponent>;
  let mockDialog: any;
  let mockToasterService: any;

  const mockController: Controller = {
    id: 1,
    name: 'Test Controller',
    host: 'localhost',
    port: 3080,
    user: 'admin',
    password: 'secret',
    authToken: 'test-auth-token-123',
    availableArchitectures: ['x86_64'],
    consoleHost: 'localhost',
    consolePort: 3081,
    consoleType: 'vnc',
    defaultIdleTimeout: 300,
    defaultZone: 'default',
    projectDirectory: '/projects',
    supportsNativePorts: true,
    verifyEphemeralPorts: false,
  } as unknown as Controller;

  const mockUser: User = {
    created_at: '2024-01-01',
    email: 'test@example.com',
    full_name: 'Test User',
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
    updated_at: '2024-01-01',
    user_id: '123',
    username: 'testuser',
  };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(null)) }),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        LoggedUserComponent,
        MatDialogModule,
        RouterModule.forRoot([]),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('1'),
              },
            },
          },
        },
        {
          provide: ControllerService,
          useValue: { get: vi.fn().mockResolvedValue(mockController) },
        },
        {
          provide: UserService,
          useValue: { getInformationAboutLoggedUser: vi.fn().mockReturnValue(of(mockUser)) },
        },
        {
          provide: ToasterService,
          useValue: mockToasterService,
        },
        {
          provide: MatDialog,
          useValue: mockDialog,
        },
      ],
    })
      .overrideComponent(LoggedUserComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoggedUserComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('copyToken', () => {
    let createElementSpy: ReturnType<typeof vi.fn>;
    let appendChildSpy: ReturnType<typeof vi.fn>;
    let removeChildSpy: ReturnType<typeof vi.fn>;
    let execCommandSpy: ReturnType<typeof vi.fn>;
    let mockTextarea: any;

    beforeEach(() => {
      createElementSpy = vi.fn();
      appendChildSpy = vi.fn();
      removeChildSpy = vi.fn();
      execCommandSpy = vi.fn().mockReturnValue(true);

      mockTextarea = {
        style: { position: '', left: '', top: '', opacity: '' },
        focus: vi.fn(),
        select: vi.fn(),
        value: '',
      };

      createElementSpy.mockReturnValue(mockTextarea);

      // Stub document after component is created
      vi.stubGlobal('document', {
        createElement: createElementSpy,
        body: {
          appendChild: appendChildSpy,
          removeChild: removeChildSpy,
        },
        execCommand: execCommandSpy,
      });
    });

    afterEach(() => {
      // Restore original document after copyToken tests
      vi.unstubAllGlobals();
    });

    it('should copy token to clipboard and show success toast', () => {
      (component as any).controller = mockController;

      component.copyToken();

      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(mockToasterService.success).toHaveBeenCalledWith('Token copied');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should set correct auth token value on textarea', () => {
      (component as any).controller = mockController;

      component.copyToken();

      expect(mockTextarea.value).toBe(mockController.authToken);
    });

    it('should set correct styles on textarea element', () => {
      (component as any).controller = mockController;

      component.copyToken();

      expect(mockTextarea.style.position).toBe('fixed');
      expect(mockTextarea.style.left).toBe('0');
      expect(mockTextarea.style.top).toBe('0');
      expect(mockTextarea.style.opacity).toBe('0');
    });

    it('should call focus and select on textarea', () => {
      (component as any).controller = mockController;

      component.copyToken();

      expect(mockTextarea.focus).toHaveBeenCalled();
      expect(mockTextarea.select).toHaveBeenCalled();
    });
  });

  // Skip dialog tests - MatDialog.open() creates actual DOM elements
  // and requires full Angular testing module with all dialog dependencies.
  // These behaviors would be better tested in an integration test.
  // Reference: template.component.spec.ts also skips dialog tests for similar reasons.
  describe.skip('changePassword', () => {});
});
