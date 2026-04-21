import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { ResetLinkActionComponent } from './reset-link-action.component';
import { LinkService } from '../../../../../services/link.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { Controller } from '../../../../../models/controller';
import { Link } from '../../../../../models/link';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ResetLinkActionComponent', () => {
  let fixture: ComponentFixture<ResetLinkActionComponent>;
  let mockLinkService: any;
  let mockToasterService: any;

  const mockController: Controller = {
    id: 1,
    authToken: 'token',
    name: 'Test Controller',
    location: 'local',
    host: 'localhost',
    port: 3080,
    path: '',
    ubridge_path: '',
    status: 'running',
    protocol: 'http:',
    username: '',
    password: '',
    tokenExpired: false,
  };

  const createMockLink = (overrides: Partial<Link> = {}): Link =>
    ({
      link_id: 'link-1',
      project_id: 'project-1',
      ...overrides,
    } as Link);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLinkService = {
      resetLink: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResetLinkActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: LinkService, useValue: mockLinkService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetLinkActionComponent);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('rendering', () => {
    it('should display reset link button with correct text', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Reset link');
    });

    it('should display settings_backup_restore icon', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('settings_backup_restore');
    });
  });

  describe('resetLink', () => {
    it('should call linkService.resetLink with controller and link when button is clicked', () => {
      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockLinkService.resetLink).toHaveBeenCalledWith(mockController, mockLink);
    });

    it('should display toaster error when resetLink fails with error message', async () => {
      const mockError = {
        error: { message: 'Connection failed' },
      };
      mockLinkService.resetLink.mockReturnValue(throwError(() => mockError));

      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Connection failed');
    });

    it('should display generic error message when resetLink fails without specific message', async () => {
      mockLinkService.resetLink.mockReturnValue(throwError(() => new Error()));

      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to reset link');
    });

    it('should call markForCheck after error in resetLink', async () => {
      mockLinkService.resetLink.mockReturnValue(throwError(() => new Error('Test error')));

      const mockLink = createMockLink();
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // Spy on the component's ChangeDetectorRef
      const component = fixture.componentInstance;
      const cdrSpy = vi.spyOn(component['cdr'], 'markForCheck');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });
});
