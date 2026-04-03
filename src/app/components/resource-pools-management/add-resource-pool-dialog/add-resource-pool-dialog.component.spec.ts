import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddResourcePoolDialogComponent } from './add-resource-pool-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PoolNameValidator } from './PoolNameValidator';
import { ResourcePoolsService } from '@services/resource-pools.service';
import { ToasterService } from '@services/toaster.service';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('AddResourcePoolDialogComponent', () => {
  let component: AddResourcePoolDialogComponent;
  let fixture: ComponentFixture<AddResourcePoolDialogComponent>;
  let mockDialogRef: any;
  let mockResourcePoolsService: any;
  let mockToasterService: any;
  let mockPoolNameValidator: any;
  let mockController: Controller;

  const createMockController = (): Controller => ({
    authToken: 'test-token',
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
  });

  beforeEach(async () => {
    mockController = createMockController();

    mockDialogRef = {
      close: vi.fn(),
    };

    mockPoolNameValidator = {
      get: vi.fn().mockReturnValue(null),
    };

    mockResourcePoolsService = {
      add: vi.fn().mockReturnValue(of({ name: 'new-pool' })),
      getAll: vi.fn().mockReturnValue(of([])),
    };

    mockToasterService = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AddResourcePoolDialogComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController } },
        { provide: ResourcePoolsService, useValue: mockResourcePoolsService },
        { provide: ToasterService, useValue: mockToasterService },
        PoolNameValidator,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddResourcePoolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('form initialization', () => {
    it('should create form with poolName control', () => {
      expect(component.poolNameForm).toBeDefined();
      expect(component.poolNameForm.get('poolName')).toBeDefined();
    });

    it('should have controller from dialog data', () => {
      expect(component.controller).toEqual(mockController);
    });

    it('should expose form getter for template access', () => {
      expect(component.form).toBeDefined();
      expect(component.form.poolName).toBeDefined();
    });
  });

  describe('onAddClick', () => {
    it('should do nothing when form is invalid', () => {
      component.poolNameForm.get('poolName')?.setValue('');
      component.poolNameForm.markAllAsTouched();

      component.onAddClick();

      expect(mockResourcePoolsService.add).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should call resourcePoolsService.add with correct parameters when form is valid', () => {
      component.poolNameForm.get('poolName')?.setValue('new-pool');

      component.onAddClick();

      expect(mockResourcePoolsService.add).toHaveBeenCalledWith(mockController, 'new-pool');
    });

    it('should close dialog with true on successful add', () => {
      component.poolNameForm.get('poolName')?.setValue('new-pool');

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show error toast and close dialog with false on add failure', () => {
      mockResourcePoolsService.add.mockReturnValue(throwError(() => new Error('API error')));
      component.poolNameForm.get('poolName')?.setValue('new-pool');

      component.onAddClick();

      expect(mockToasterService.error).toHaveBeenCalledWith('An error occur while trying to create new pool new-pool');
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onNoClick', () => {
    it('should close dialog without value', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onKeyDown', () => {
    it('should call onAddClick when Enter key is pressed', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      vi.spyOn(component, 'onAddClick');

      component.onKeyDown(enterEvent);

      expect(component.onAddClick).toHaveBeenCalled();
    });

    it('should not call onAddClick for non-Enter keys', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      vi.spyOn(component, 'onAddClick');

      component.onKeyDown(escapeEvent);

      expect(component.onAddClick).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should validate empty poolName as invalid', () => {
      const control = component.poolNameForm.get('poolName');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.valid).toBe(false);
      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should validate poolName with special characters as invalid', () => {
      const control = component.poolNameForm.get('poolName');
      mockPoolNameValidator.get.mockReturnValue({ invalidName: true });
      control?.setValue('pool@name');
      control?.markAsTouched();

      expect(control?.valid).toBe(false);
    });

    it('should pass sync validation for valid poolName without special characters', () => {
      const control = component.poolNameForm.get('poolName');
      control?.setValue('valid-pool-name');
      control?.markAsTouched();

      // The sync validator (PoolNameValidator) should return null (valid)
      // Special characters like @ should fail validation
      expect(control?.errors).toBeNull();
    });
  });
});
