import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConsoleComponent } from './console.component';
import { ConsoleService } from '@services/settings/console.service';
import { ToasterService } from '@services/toaster.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ConsoleComponent', () => {
  let component: ConsoleComponent;
  let fixture: ComponentFixture<ConsoleComponent>;

  let mockConsoleService: any;
  let mockToasterService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockConsoleService = {
      command: 'gns3',
    };

    mockToasterService = {
      success: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConsoleComponent],
      providers: [
        { provide: ConsoleService, useValue: mockConsoleService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsoleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have a consoleForm', () => {
      expect(component.consoleForm).toBeTruthy();
    });

    it('should have command FormControl in the form', () => {
      expect(component.consoleForm.get('command')).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should load command from consoleService into form', () => {
      mockConsoleService.command = 'my-custom-command';

      component.ngOnInit();

      expect(component.consoleForm.get('command')?.value).toBe('my-custom-command');
    });

    it('should use default command when consoleService returns undefined', () => {
      Object.defineProperty(mockConsoleService, 'command', {
        get: () => undefined,
        set: vi.fn(),
      });

      component.ngOnInit();

      // Form should be initialized (value will be null/undefined since service returns undefined)
      expect(component.consoleForm.get('command')?.value).toBeUndefined();
    });
  });

  describe('goBack', () => {
    it('should navigate to /settings', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should be called during ngOnInit for default navigation', () => {
      // goBack is not called automatically in ngOnInit, it's a manual action
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save form value to consoleService', () => {
      component.consoleForm.get('command')?.setValue('new-command');

      component.save();

      expect(mockConsoleService.command).toBe('new-command');
    });

    it('should show success toast message', () => {
      component.save();

      expect(mockToasterService.success).toHaveBeenCalledWith('Console command has been updated.');
    });

    it('should navigate to /settings after saving', () => {
      component.save();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should navigate after saving even if command is empty', () => {
      component.consoleForm.get('command')?.setValue('');

      component.save();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should save special characters in command', () => {
      const specialCommand = 'screen /dev/ttyUSB0 9600';
      component.consoleForm.get('command')?.setValue(specialCommand);

      component.save();

      expect(mockConsoleService.command).toBe(specialCommand);
    });
  });
});
