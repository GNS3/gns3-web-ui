import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteRoleDialogComponent } from './delete-role-dialog.component';
import { Role } from '@models/api/role';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DeleteRoleDialogComponent', () => {
  let fixture: ComponentFixture<DeleteRoleDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  const mockRoles: Role[] = [
    { name: 'Admin', description: '', created_at: '', updated_at: '', role_id: '', is_builtin: false, privileges: [] },
    { name: 'User', description: '', created_at: '', updated_at: '', role_id: '', is_builtin: false, privileges: [] },
  ];

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DeleteRoleDialogComponent, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { roles: mockRoles } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteRoleDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('template rendering', () => {
    it('should display the roles to delete', () => {
      const roleItems = fixture.nativeElement.querySelectorAll('ul li');
      expect(roleItems.length).toBe(2);
      expect(roleItems[0].textContent).toContain('Admin');
      expect(roleItems[1].textContent).toContain('User');
    });

    it('should have cancel and delete buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without a value', () => {
      fixture.componentInstance.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onDelete', () => {
    it('should close dialog with true', () => {
      fixture.componentInstance.onDelete();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
