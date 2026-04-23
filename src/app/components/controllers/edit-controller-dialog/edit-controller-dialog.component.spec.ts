import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditControllerDialogComponent } from './edit-controller-dialog.component';
import { Controller } from '@models/controller';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ChangeDetectorRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EditControllerDialogComponent', () => {
  let component: EditControllerDialogComponent;
  let fixture: ComponentFixture<EditControllerDialogComponent>;
  let mockDialogRef: any;
  let mockControllerService: any;
  let mockToasterService: any;
  let mockChangeDetectorRef: any;

  const mockController: Controller = {
    authToken: 'token123',
    id: 1,
    name: 'TestController',
    location: 'local',
    host: '127.0.0.1',
    port: 3080,
    path: '/path',
    ubridge_path: '/ubridge',
    status: 'running',
    protocol: 'http:',
    username: 'admin',
    password: 'admin',
    tokenExpired: false,
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockControllerService = {
      update: vi.fn().mockReturnValue(Promise.resolve(mockController)),
      isControllerNameTaken: vi.fn().mockReturnValue(false),
    };
    mockToasterService = { success: vi.fn(), error: vi.fn() };
    mockChangeDetectorRef = { markForCheck: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [EditControllerDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockController },
        { provide: ControllerService, useValue: mockControllerService },
        { provide: ToasterService, useValue: mockToasterService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditControllerDialogComponent);
    component = fixture.componentInstance;
    component.controller = mockController;
    fixture.detectChanges();
    vi.clearAllMocks();
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

    it('should have controller from dialog data', () => {
      expect(component.controller).toEqual(mockController);
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form with controller values', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.controllerForm.value.name).toBe(mockController.name);
      expect(component.controllerForm.value.host).toBe(mockController.host);
      expect(component.controllerForm.value.port).toBe(mockController.port);
      expect(component.controllerForm.value.protocol).toBe(mockController.protocol);
    });

    it('should have required validator on name field', () => {
      component.ngOnInit();
      component.controllerForm.get('name')?.setValue('');
      fixture.detectChanges();

      expect(component.controllerForm.get('name')?.hasError('required')).toBe(true);
    });

    it('should have required validator on host field', () => {
      component.ngOnInit();
      component.controllerForm.get('host')?.setValue('');
      fixture.detectChanges();

      expect(component.controllerForm.get('host')?.hasError('required')).toBe(true);
    });

    it('should have min validator on port field', () => {
      component.ngOnInit();
      component.controllerForm.get('port')?.setValue(0);
      fixture.detectChanges();

      expect(component.controllerForm.get('port')?.hasError('min')).toBe(true);
    });
  });

  describe('onSave', () => {
    it('should return early if form is invalid', () => {
      component.ngOnInit();
      fixture.detectChanges();
      // Clear all values to make form invalid
      component.controllerForm.get('name')?.setValue('');
      component.controllerForm.get('host')?.setValue('');
      component.controllerForm.get('port')?.setValue(null);

      component.onSave();

      expect(mockControllerService.update).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not check duplicate name when name has not changed', () => {
      component.ngOnInit();
      fixture.detectChanges();
      // Name is already mockController.name from ngOnInit, so no duplicate check

      component.onSave();

      expect(mockControllerService.isControllerNameTaken).not.toHaveBeenCalled();
    });

    it('should close dialog with updated controller on successful save', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      component.controllerForm.patchValue({
        name: 'NewName',
        host: '192.168.1.1',
        port: 8080,
        protocol: 'https:',
      });

      component.onSave();
      await Promise.resolve(); // Wait for promise to resolve

      expect(mockControllerService.update).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockToasterService.success).toHaveBeenCalledWith('Controller NewName updated.');
    });

    it('should show error and return early when name is duplicate', () => {
      component.ngOnInit();
      fixture.detectChanges();
      mockControllerService.isControllerNameTaken.mockReturnValue(true);
      // Change name to trigger duplicate check
      component.controllerForm.get('name')?.setValue('DuplicateName');

      const markForCheckSpy = vi.spyOn(component['changeDetector'], 'markForCheck');

      component.onSave();

      expect(component.duplicateNameError).toBe('Controller with name "DuplicateName" already exists');
      expect(mockToasterService.error).toHaveBeenCalled();
      expect(markForCheckSpy).toHaveBeenCalled();
      expect(mockControllerService.update).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should allow save when name is same as existing (no duplicate check)', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      // Even if isControllerNameTaken returns true, it shouldn't be called
      // because name hasn't changed
      mockControllerService.isControllerNameTaken.mockReturnValue(true);
      // Form already has mockController.name from ngOnInit, so name hasn't changed

      component.onSave();
      await Promise.resolve();

      expect(mockControllerService.isControllerNameTaken).not.toHaveBeenCalled();
      expect(mockControllerService.update).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should display error when update fails', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      mockControllerService.update = vi.fn().mockRejectedValue({ error: { message: 'Update failed' } });
      const markForCheckSpy = vi.spyOn(component['changeDetector'], 'markForCheck');

      component.onSave();
      await Promise.resolve();

      expect(mockToasterService.error).toHaveBeenCalledWith('Update failed');
      expect(markForCheckSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should display fallback error when update fails with no message', async () => {
      component.ngOnInit();
      fixture.detectChanges();
      mockControllerService.update = vi.fn().mockRejectedValue(new Error('Network error'));
      const markForCheckSpy = vi.spyOn(component['changeDetector'], 'markForCheck');

      component.onSave();
      await Promise.resolve();

      expect(mockToasterService.error).toHaveBeenCalledWith('Network error');
      expect(markForCheckSpy).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
