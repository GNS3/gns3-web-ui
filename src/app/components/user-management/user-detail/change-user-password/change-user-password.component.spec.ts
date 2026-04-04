import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeUserPasswordComponent } from './change-user-password.component';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '@services/user.service';
import { ToasterService } from '@services/toaster.service';
import { User } from '@models/users/user';
import { Controller } from '@models/controller';
import { of, throwError } from 'rxjs';

describe('ChangeUserPasswordComponent', () => {
  let component: ChangeUserPasswordComponent;
  let fixture: ComponentFixture<ChangeUserPasswordComponent>;
  let mockDialogRef: any;
  let mockUserService: any;
  let mockToasterService: any;

  const mockUser: User = {
    user_id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    full_name: 'Test User',
    last_login: '2024-01-01',
    is_active: true,
    is_superadmin: false,
  };

  const mockController: Controller = {
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
  };

  const dialogData = {
    user: mockUser,
    controller: mockController,
    self_update: false,
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockUserService = {
      update: vi.fn(),
    };

    mockToasterService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ChangeUserPasswordComponent, ReactiveFormsModule, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: UserService, useValue: mockUserService },
        { provide: ToasterService, useValue: mockToasterService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeUserPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component initialization', () => {
    it('should have editPasswordForm with password and confirmPassword controls', () => {
      expect(component.editPasswordForm.contains('password')).toBe(true);
      expect(component.editPasswordForm.contains('confirmPassword')).toBe(true);
    });

    it('should have passwordForm getter returning form controls', () => {
      const controls = component.passwordForm;
      expect(controls).toBeDefined();
      expect(controls.password).toBeDefined();
      expect(controls.confirmPassword).toBeDefined();
    });

    it('should have user signal initialized with dialog data', () => {
      expect(component.user()).toEqual(mockUser);
    });
  });

  describe('onCancel', () => {
    it('should call dialogRef.close()', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onPasswordSave with invalid form', () => {
    it('should return early when form is invalid', () => {
      component.editPasswordForm.setValue({
        password: 'weak',
        confirmPassword: 'weak',
      });
      fixture.detectChanges();

      component.onPasswordSave();

      expect(mockUserService.update).not.toHaveBeenCalled();
      expect(mockToasterService.success).not.toHaveBeenCalled();
      expect(mockToasterService.error).not.toHaveBeenCalled();
    });

    it('should return early when password is empty', () => {
      component.editPasswordForm.setValue({
        password: '',
        confirmPassword: '',
      });
      fixture.detectChanges();

      component.onPasswordSave();

      expect(mockUserService.update).not.toHaveBeenCalled();
    });
  });

  describe('onPasswordSave with valid form', () => {
    const validPassword = 'Password123';

    beforeEach(() => {
      component.editPasswordForm.setValue({
        password: validPassword,
        confirmPassword: validPassword,
      });
      fixture.detectChanges();
    });

    it('should call userService.update with correct parameters', () => {
      const expectedUser = {
        password: validPassword,
        user_id: 'user-123',
      };

      mockUserService.update.mockReturnValue(of(mockUser));

      component.onPasswordSave();

      expect(mockUserService.update).toHaveBeenCalledTimes(1);
      expect(mockUserService.update).toHaveBeenCalledWith(mockController, expectedUser, false);
    });

    it('should show success toast on successful update', () => {
      mockUserService.update.mockReturnValue(of(mockUser));

      component.onPasswordSave();
      fixture.detectChanges();

      expect(mockToasterService.success).toHaveBeenCalledTimes(1);
      expect(mockToasterService.success).toHaveBeenCalledWith('User testuser password updated');
    });

    it('should reset form after successful update', () => {
      mockUserService.update.mockReturnValue(of(mockUser));
      const resetSpy = vi.spyOn(component.editPasswordForm, 'reset');

      component.onPasswordSave();
      fixture.detectChanges();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it('should close dialog with true on successful update', () => {
      mockUserService.update.mockReturnValue(of(mockUser));

      component.onPasswordSave();
      fixture.detectChanges();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show error toast on update failure', () => {
      const error = new Error('Update failed');
      mockUserService.update.mockReturnValue(throwError(() => error));

      component.onPasswordSave();
      fixture.detectChanges();

      expect(mockToasterService.error).toHaveBeenCalledTimes(1);
      expect(mockToasterService.error).toHaveBeenCalledWith(`Cannot update password for user: ${error}`);
    });

    it('should not close dialog on update failure', () => {
      mockUserService.update.mockReturnValue(throwError(() => new Error('failed')));

      component.onPasswordSave();
      fixture.detectChanges();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not reset form on update failure', () => {
      mockUserService.update.mockReturnValue(throwError(() => new Error('failed')));
      const resetSpy = vi.spyOn(component.editPasswordForm, 'reset');

      component.onPasswordSave();
      fixture.detectChanges();

      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe('password validation', () => {
    it.each([
      ['Password123', true, 'valid password matching pattern'],
      ['Pass123', false, 'password too short (less than 8 chars)'],
      ['password123', false, 'password without uppercase'],
      ['PASSWORD123', false, 'password without lowercase'],
      ['Password', false, 'password without digit'],
      ['', false, 'empty password'],
    ])('should validate %s as %p (%s)', (password, expectedValid, _description) => {
      component.editPasswordForm.setValue({
        password: password,
        confirmPassword: password,
      });
      fixture.detectChanges();

      const isValid = component.editPasswordForm.valid;
      expect(isValid).toBe(expectedValid);
    });

    it('should fail validation when passwords do not match', () => {
      component.editPasswordForm.setValue({
        password: 'Password123',
        confirmPassword: 'DifferentPass123',
      });
      fixture.detectChanges();

      expect(component.editPasswordForm.valid).toBe(false);
      expect(component.editPasswordForm.get('confirmPassword').errors).toEqual({ confirmPasswordMatch: true });
    });

    it('should pass validation when passwords match', () => {
      component.editPasswordForm.setValue({
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      fixture.detectChanges();

      expect(component.editPasswordForm.valid).toBe(true);
      expect(component.editPasswordForm.errors).toBeNull();
    });
  });
});
