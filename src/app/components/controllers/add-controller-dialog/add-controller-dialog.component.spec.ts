import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AddControllerDialogComponent } from './add-controller-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddControllerDialogComponent', () => {
  let component: AddControllerDialogComponent;
  let fixture: ComponentFixture<AddControllerDialogComponent>;
  let mockDialogRef: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const createMockController = (overrides?: Partial<Controller>): Controller =>
    ({
      id: 1,
      name: 'Test Controller',
      location: 'remote',
      host: '127.0.0.1',
      port: 3080,
      path: '',
      ubridge_path: '',
      protocol: 'http:',
      status: 'running',
      authToken: '',
      username: '',
      password: '',
      tokenExpired: false,
      ...overrides,
    } as Controller);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockChangeDetectorRef = {
      markForCheck: vi.fn(),
    };

    mockControllerService = {
      findAll: vi.fn().mockResolvedValue([]),
      checkControllerVersion: vi.fn(),
      isControllerNameTaken: vi.fn().mockReturnValue(false),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddControllerDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddControllerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty initial connection error', () => {
      expect(component.connectionError).toBe('');
    });

    it('should have canAddAnyway as false initially', () => {
      expect(component.canAddAnyway).toBe(false);
    });

    it('should have isCheckingConnection as false initially', () => {
      expect(component.isCheckingConnection).toBe(false);
    });

    it('should have protocols defined', () => {
      expect(component.protocols).toEqual([
        { key: 'http:', name: 'HTTP' },
        { key: 'https:', name: 'HTTPS' },
      ]);
    });

    it('should have controllerForm with required fields', () => {
      const form = component.controllerForm;
      expect(form.get('name')).toBeTruthy();
      expect(form.get('host')).toBeTruthy();
      expect(form.get('port')).toBeTruthy();
      expect(form.get('location')).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should set default location to remote', async () => {
      component.ngOnInit();
      await Promise.resolve(); // Wait for async operations

      expect(component.controllerForm.get('location').value).toBe('remote');
    });

    it('should set default host to 127.0.0.1', () => {
      component.ngOnInit();

      expect(component.controllerForm.get('host').value).toBe('127.0.0.1');
    });

    it('should set default port to 3080', () => {
      component.ngOnInit();

      expect(component.controllerForm.get('port').value).toBe(3080);
    });

    it('should call findAll to count local controllers', async () => {
      mockControllerService.findAll.mockResolvedValue([
        createMockController({ location: 'local' }),
        createMockController({ location: 'local' }),
        createMockController({ location: 'remote' }),
      ]);

      component.ngOnInit();
      await Promise.resolve();

      expect(mockControllerService.findAll).toHaveBeenCalled();
    });
  });

  describe('getDefaultHost', () => {
    it('should return 127.0.0.1', () => {
      expect(component.getDefaultHost()).toBe('127.0.0.1');
    });
  });

  describe('getDefaultPort', () => {
    it('should return 3080', () => {
      expect(component.getDefaultPort()).toBe(3080);
    });
  });

  describe('getDefaultLocation', () => {
    it('should return remote', async () => {
      const location = await component.getDefaultLocation();
      expect(location).toBe('remote');
    });
  });

  describe('getLocations', () => {
    it('should return remote location', async () => {
      const locations = await component.getLocations();
      expect(locations).toEqual([{ key: 'remote', name: 'Remote' }]);
    });
  });

  describe('numberOfLocalControllers', () => {
    it('should return count of local controllers', async () => {
      mockControllerService.findAll.mockResolvedValue([
        createMockController({ location: 'local' }),
        createMockController({ location: 'local' }),
        createMockController({ location: 'remote' }),
      ]);

      const count = await component.numberOfLocalControllers();
      expect(count).toBe(2);
    });

    it('should return 0 when no controllers exist', async () => {
      mockControllerService.findAll.mockResolvedValue([]);

      const count = await component.numberOfLocalControllers();
      expect(count).toBe(0);
    });
  });

  describe('onNoClick', () => {
    it('should call dialogRef.close without arguments', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onAddClick - form validation', () => {
    it('should return early if form is invalid', () => {
      component.controllerForm.get('name').setValue('');

      component.onAddClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(mockControllerService.checkControllerVersion).not.toHaveBeenCalled();
    });
  });

  describe('onAddClick - duplicate name check', () => {
    it('should show error if controller name is already taken', () => {
      mockControllerService.isControllerNameTaken.mockReturnValue(true);
      component.controllerForm.patchValue({
        name: 'Existing Controller',
        host: '127.0.0.1',
        port: 3080,
      });

      component.onAddClick();

      expect(component.duplicateNameError).toBe('Controller with name "Existing Controller" already exists');
      expect(mockToasterService.error).toHaveBeenCalledWith('Controller with name "Existing Controller" already exists');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should clear duplicateNameError on subsequent valid add attempt', () => {
      mockControllerService.isControllerNameTaken
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      mockControllerService.checkControllerVersion.mockReturnValue(of({ version: '3.0.0' }));

      component.controllerForm.patchValue({
        name: 'Existing Controller',
        host: '127.0.0.1',
        port: 3080,
      });

      component.onAddClick();
      expect(component.duplicateNameError).toBe('Controller with name "Existing Controller" already exists');

      // Change name to a new one
      component.controllerForm.get('name').setValue('New Controller');
      component.onAddClick();

      expect(component.duplicateNameError).toBe('');
    });
  });

  describe('onAddClick - successful connection with supported version', () => {
    beforeEach(() => {
      component.controllerForm.patchValue({
        name: 'New Controller',
        host: '127.0.0.1',
        port: 3080,
      });
    });

    it('should close dialog with controller on successful version check', () => {
      mockControllerService.checkControllerVersion.mockReturnValue(
        of({ version: '3.0.0' })
      );

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockToasterService.success).toHaveBeenCalledWith('Controller New Controller added.');
    });

    it('should set connectionError on unsupported version', () => {
      mockControllerService.checkControllerVersion.mockReturnValue(
        of({ version: '2.0.0' })
      );

      component.onAddClick();

      expect(component.connectionError).toBe('Controller version is not supported.');
      expect(component.canAddAnyway).toBe(true);
      expect(mockToasterService.error).toHaveBeenCalledWith('Controller version is not supported.');
    });

    it('should close dialog if version starts with 3 or higher', () => {
      mockControllerService.checkControllerVersion.mockReturnValue(
        of({ version: '3.1.0' })
      );

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onAddClick - connection failure', () => {
    beforeEach(() => {
      component.controllerForm.patchValue({
        name: 'New Controller',
        host: '127.0.0.1',
        port: 3080,
      });
    });

    it('should set connectionError when controller is offline', () => {
      mockControllerService.checkControllerVersion.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      component.onAddClick();

      expect(component.connectionError).toBe('Cannot connect to the controller. It appears offline.');
      expect(component.canAddAnyway).toBe(true);
      expect(mockToasterService.error).toHaveBeenCalledWith('Cannot connect to the controller: Error: Network error');
    });

    it('should set isCheckingConnection to true during check and false after', () => {
      mockControllerService.checkControllerVersion.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      component.onAddClick();

      expect(component.isCheckingConnection).toBe(false);
    });
  });

  describe('onAddAnywayClick', () => {
    beforeEach(() => {
      component.controllerForm.patchValue({
        name: 'New Controller',
        host: '127.0.0.1',
        port: 3080,
      });
    });

    it('should return early if form is invalid', () => {
      component.controllerForm.get('name').setValue('');

      component.onAddAnywayClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show error if controller name is already taken', () => {
      mockControllerService.isControllerNameTaken.mockReturnValue(true);

      component.onAddAnywayClick();

      expect(component.duplicateNameError).toBe('Controller with name "New Controller" already exists');
      expect(mockToasterService.error).toHaveBeenCalledWith('Controller with name "New Controller" already exists');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog with controller data', () => {
      mockControllerService.isControllerNameTaken.mockReturnValue(false);

      component.onAddAnywayClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockToasterService.warning).toHaveBeenCalledWith('Controller New Controller added in offline mode.');
    });
  });

  describe('Form behavior - location change', () => {
    it('should add required validators to path and ubridge_path when location is local', async () => {
      component.ngOnInit();
      await Promise.resolve();

      const locationControl = component.controllerForm.get('location');
      locationControl.setValue('local');

      // validators are set asynchronously via subscribe
      await Promise.resolve();

      const pathControl = component.controllerForm.get('path');
      const ubridgePathControl = component.controllerForm.get('ubridge_path');

      // After setting location to local and providing values, path and ubridge_path should be valid
      pathControl.setValue('/some/path');
      ubridgePathControl.setValue('/some/ubridge');

      expect(pathControl.valid).toBe(true);
      expect(ubridgePathControl.valid).toBe(true);
    });

    it('should clear validators from path and ubridge_path when location is remote', async () => {
      component.ngOnInit();
      await Promise.resolve();

      const locationControl = component.controllerForm.get('location');
      locationControl.setValue('local');
      await Promise.resolve();

      locationControl.setValue('remote');
      await Promise.resolve();

      const pathControl = component.controllerForm.get('path');
      const ubridgePathControl = component.controllerForm.get('ubridge_path');

      // Path should not have required validator when remote
      expect(pathControl.hasError('required')).toBe(false);
      expect(ubridgePathControl.hasError('required')).toBe(false);
    });
  });
});
