import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AddRoleDialogComponent } from './add-role-dialog.component';
import { Controller } from '@models/controller';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AddRoleDialogComponent', () => {
  let component: AddRoleDialogComponent;
  let fixture: ComponentFixture<AddRoleDialogComponent>;
  let mockDialogRef: any;
  let mockController: Controller;

  const createMockController = (): Controller =>
    ({
      id: 1,
      authToken: '',
      name: 'Test Controller',
      location: 'local',
      host: '192.168.1.100',
      port: 3080,
      path: '',
      ubridge_path: '',
      status: 'running',
      protocol: 'http:',
      username: '',
      password: '',
      tokenExpired: false,
    } as Controller);

  beforeEach(async () => {
    mockController = createMockController();
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddRoleDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { controller: mockController } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should receive controller data via MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.controller).toEqual(mockController);
    });

    it('should initialize form with empty name and description controls', () => {
      expect(component.roleNameForm).toBeDefined();
      expect(component.roleNameForm.get('name')).toBeDefined();
      expect(component.roleNameForm.get('description')).toBeDefined();
    });
  });

  describe('form getter', () => {
    it('should return form controls', () => {
      expect(component.form).toBeDefined();
      expect(component.form.name).toBeDefined();
      expect(component.form.description).toBeDefined();
    });
  });

  describe('onAddClick', () => {
    it('should close dialog with form data when form is valid', () => {
      component.roleNameForm.patchValue({ name: 'Admin', description: 'Administrator role' });

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        name: 'Admin',
        description: 'Administrator role',
      });
    });

    it('should close dialog with null description when only name is provided', () => {
      component.roleNameForm.patchValue({ name: 'Viewer' });

      component.onAddClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        name: 'Viewer',
        description: null,
      });
    });
  });

  describe('onNoClick', () => {
    it('should close dialog without data', () => {
      component.onNoClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
