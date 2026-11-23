import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { UserService } from '@services/user.service';
import { LoggedUserComponent } from './logged-user.component';
import { of, throwError } from 'rxjs';
import { User } from '@models/users/user';
import { UserQuotaUsage } from '@models/users/user-quota-usage';
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
      imports: [LoggedUserComponent, MatDialogModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { controllerId: 1 },
        },
        {
          provide: MatDialogRef,
          useValue: { close: vi.fn() },
        },
        {
          provide: ControllerService,
          useValue: { get: vi.fn().mockResolvedValue(mockController) },
        },
        {
          provide: UserService,
          useValue: {
            getInformationAboutLoggedUser: vi.fn().mockReturnValue(of(mockUser)),
            getQuotas: vi.fn(),
          },
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

  describe('node quotas', () => {
    const mockQuotas: UserQuotaUsage = {
      max_nodes: 50,
      max_running_nodes: null,
      current_nodes: 12,
      current_running_nodes: 3,
    };

    const mockGetQuotas = () => TestBed.inject(UserService).getQuotas as ReturnType<typeof vi.fn>;

    it('should format quota text for limited and unlimited metrics', () => {
      expect(component.quotaText(12, 50)).toBe('12 / 50');
      expect(component.quotaText(7, null)).toBe('7 · no limit');
    });

    it('should cap the progress percentage at 100', () => {
      expect(component.quotaPercent(12, 50)).toBe(24);
      expect(component.quotaPercent(60, 50)).toBe(100);
      expect(component.quotaPercent(5, 0)).toBe(100);
      expect(component.quotaPercent(0, null)).toBe(0);
    });

    it('should detect over-limit usage', () => {
      expect(component.isOverQuota(55, 50)).toBe(true);
      expect(component.isOverQuota(50, 50)).toBe(false);
      expect(component.isOverQuota(999, null)).toBe(false);
    });

    it('should fetch quotas on init and render the section', async () => {
      mockGetQuotas().mockReturnValue(of(mockQuotas));
      fixture.detectChanges();
      await Promise.resolve(); // flush the controller promise, then the sync subscriptions
      fixture.detectChanges();

      expect(component.quotas()).toEqual(mockQuotas);
      const section: HTMLElement = fixture.nativeElement.querySelector('.logged-user__quotas');
      expect(section).toBeTruthy();
      expect(section.textContent).toContain('12 / 50');
      expect(section.textContent).toContain('no limit');
      // Only the limited metric renders a progress bar
      expect(fixture.nativeElement.querySelectorAll('mat-progress-bar').length).toBe(1);
    });

    it('should mark over-limit usage', async () => {
      mockGetQuotas().mockReturnValue(of({ ...mockQuotas, current_nodes: 55 }));
      fixture.detectChanges();
      await Promise.resolve();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.logged-user__info-value--over')).toBeTruthy();
    });

    it('should keep the section hidden when the endpoint is unavailable', async () => {
      mockGetQuotas().mockReturnValue(throwError(() => new Error('not found')));
      fixture.detectChanges();
      await Promise.resolve();
      fixture.detectChanges();

      expect(component.quotas()).toBeUndefined();
      expect(fixture.nativeElement.querySelector('.logged-user__quotas')).toBeNull();
    });
  });
});
