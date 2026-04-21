import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { StopCaptureActionComponent } from './stop-capture-action.component';
import { LinkService } from '../../../../../services/link.service';
import { ToasterService } from '../../../../../services/toaster.service';
import { Controller } from '../../../../../models/controller';
import { Link } from '../../../../../models/link';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StopCaptureActionComponent', () => {
  let fixture: ComponentFixture<StopCaptureActionComponent>;
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
      capturing: false,
      ...overrides,
    } as Link);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLinkService = {
      stopCaptureOnLink: vi.fn().mockReturnValue(of({})),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StopCaptureActionComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [
        { provide: LinkService, useValue: mockLinkService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StopCaptureActionComponent);
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('rendering', () => {
    it('should not show stop capture button when link is not capturing', () => {
      const mockLink = createMockLink({ capturing: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should show stop capture button when link is capturing', () => {
      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button).not.toBeNull();
      expect(button.textContent).toContain('Stop capture');
    });

    it('should display pause icon in button', () => {
      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('pause_circle_filled');
    });
  });

  describe('stopCapture', () => {
    it('should call linkService.stopCaptureOnLink with controller and link when button is clicked', () => {
      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(mockLinkService.stopCaptureOnLink).toHaveBeenCalledWith(mockController, mockLink);
    });

    it('should not call linkService.stopCaptureOnLink when link is not capturing', () => {
      const mockLink = createMockLink({ capturing: false });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      // No button exists, so nothing to click
      expect(mockLinkService.stopCaptureOnLink).not.toHaveBeenCalled();
    });

    it('should display toaster error when stopCaptureOnLink fails with error message', async () => {
      const mockError = {
        error: { message: 'Capture device busy' },
      };
      mockLinkService.stopCaptureOnLink.mockReturnValue(throwError(() => mockError));

      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Capture device busy');
    });

    it('should display generic error message when stopCaptureOnLink fails without specific message', async () => {
      mockLinkService.stopCaptureOnLink.mockReturnValue(throwError(() => new Error()));

      const mockLink = createMockLink({ capturing: true });
      fixture.componentRef.setInput('link', mockLink);
      fixture.componentRef.setInput('controller', mockController);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      // Advance fake timers for async error handling
      await vi.runAllTimersAsync();

      expect(mockToasterService.error).toHaveBeenCalledWith('Failed to stop capture');
    });

    it('should call markForCheck after error in stopCaptureOnLink', async () => {
      mockLinkService.stopCaptureOnLink.mockReturnValue(throwError(() => new Error('Test error')));

      const mockLink = createMockLink({ capturing: true });
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
